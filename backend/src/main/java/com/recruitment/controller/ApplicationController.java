package com.recruitment.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.recruitment.ai.AiService;
import com.recruitment.dto.ApplicantScreeningResponse;
import com.recruitment.entity.*;
import com.recruitment.dto.ApplicationResponse;
import com.recruitment.dto.ApplicationSubmission;
import com.recruitment.dto.InterviewScheduleRequest;
import com.recruitment.dto.InterviewScheduleResponse;
import com.recruitment.repository.*;
import com.recruitment.service.FileStorageService;
import com.recruitment.service.InterviewInvitationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import jakarta.validation.Valid;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/applications")
public class ApplicationController {
    private final ApplicationRepository applications; private final CandidateRepository candidates;
    private final JobRepository jobs; private final UserRepository users;
    private final InterviewInvitationService interviewInvitations;
    private final AiService ai;
    private final FileStorageService fileStorage;
    public ApplicationController(ApplicationRepository applications,CandidateRepository candidates,JobRepository jobs,
                                 UserRepository users,InterviewInvitationService interviewInvitations,AiService ai,
                                 FileStorageService fileStorage){
        this.applications=applications;this.candidates=candidates;this.jobs=jobs;this.users=users;
        this.interviewInvitations=interviewInvitations;this.ai=ai;this.fileStorage=fileStorage;
    }
    @PostMapping @PreAuthorize("hasRole('CANDIDATE')")
    public ApplicationResponse apply(@RequestParam Long jobId, Authentication auth){
        Candidate c=candidates.findByUser(users.findByEmail(auth.getName()).orElseThrow()).orElseThrow();
        Job j=jobs.findById(jobId).orElseThrow();
        if (!j.isActive()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Job is not active");
        if (applications.findByCandidateAndJob(c,j).isPresent()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Already applied");
        Application a=new Application(); a.setCandidate(c);a.setJob(j);a.setApplicationMethod(ApplicationMethod.MANUAL);
        return ApplicationResponse.from(applications.save(a));
    }
    @PostMapping("/submit") @PreAuthorize("hasRole('CANDIDATE')")
    public ApplicationResponse submit(@Valid @RequestBody ApplicationSubmission request,Authentication auth){
        Candidate candidate=candidates.findByUser(users.findByEmail(auth.getName()).orElseThrow()).orElseThrow();
        Job job=jobs.findById(request.jobId()).orElseThrow();
        if(!job.isActive()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Job is not active");
        if(applications.findByCandidateAndJob(candidate,job).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Already applied");
        if(request.method()==ApplicationMethod.WITH_RESUME && candidate.getResumePath()==null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Upload a resume before applying with resume");
        Application application=new Application();
        application.setCandidate(candidate);
        application.setJob(job);
        application.setApplicationMethod(request.method());
        application.setCoverLetter(request.coverLetter());
        if(request.method()==ApplicationMethod.WITH_RESUME) application.setResumePath(candidate.getResumePath());
        return ApplicationResponse.from(applications.save(application));
    }
    @GetMapping("/my") @PreAuthorize("hasRole('CANDIDATE')")
    public List<ApplicationResponse> mine(Authentication auth){Candidate c=candidates.findByUser(users.findByEmail(auth.getName()).orElseThrow()).orElseThrow();return applications.findByCandidate(c).stream().map(ApplicationResponse::from).toList();}
    @GetMapping("/job/{jobId}") @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public List<ApplicationResponse> forJob(@PathVariable Long jobId,Authentication auth){
        Job job=jobs.findById(jobId).orElseThrow();
        ensureJobOwner(job,auth);
        return applications.findByJob(job).stream().map(ApplicationResponse::from).toList();
    }
    @PostMapping("/job/{jobId}/screen")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public List<ApplicantScreeningResponse> screenApplicants(@PathVariable Long jobId,Authentication auth) {
        Job job=jobs.findById(jobId).orElseThrow();
        ensureJobOwner(job,auth);
        String jobContext=String.join("\n",
                "Title: "+nullToEmpty(job.getTitle()),
                "Required skills: "+nullToEmpty(job.getRequiredSkills()),
                "Qualifications: "+nullToEmpty(job.getQualification()),
                "Experience: "+nullToEmpty(job.getExperience()),
                "Description: "+nullToEmpty(job.getDescription()));
        List<Application> jobApplications=applications.findByJob(job);
        Map<Long,Application> applicationsById=new HashMap<>();
        List<ApplicantScreeningResponse> results=new ArrayList<>();
        for (Application application:jobApplications) {
            applicationsById.put(application.getId(),application);
            String resumeText;
            try {
                resumeText=screeningText(application);
            } catch (IOException exception) {
                results.add(new ApplicantScreeningResponse(application.getId(),
                        application.getCandidate().getUser().getName(),application.getApplicationStatus(),
                        application.getResumePath()!=null,null,"","","Could not read this resume. Download it and review it manually.",
                        "Resume could not be read",false,false,""));
                continue;
            }
            if (resumeText.isBlank()) {
                results.add(new ApplicantScreeningResponse(application.getId(),
                        application.getCandidate().getUser().getName(),application.getApplicationStatus(),
                        application.getResumePath()!=null,null,"",nullToEmpty(job.getRequiredSkills()),
                        "There is not enough resume or profile information to assess this applicant.",
                        application.getResumePath()==null?"No resume or profile details":"Resume contains no readable text",
                        false,false,""));
                continue;
            }
            JsonNode assessment=ai.screenApplicantWithJob(limit(resumeText,14_000),limit(jobContext,8_000));
            if (assessment==null || !assessment.isObject()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "The AI provider returned an invalid applicant assessment. Please try screening again.");
            }
            JsonNode score=assessment.path("overallMatchPercentage");
            if (!score.isIntegralNumber() || score.asInt()<0 || score.asInt()>100) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "The AI provider returned an invalid applicant match score. Please try screening again.");
            }
            String matchingSkills=skillEvidence(assessment.path("matchingSkills"),
                    job.getRequiredSkills(),resumeText,true);
            String missingSkills=skillEvidence(assessment.path("missingSkills"),
                    job.getRequiredSkills(),resumeText,false);
            results.add(new ApplicantScreeningResponse(application.getId(),
                    application.getCandidate().getUser().getName(),application.getApplicationStatus(),
                    application.getResumePath()!=null,score.asInt(),matchingSkills,
                    missingSkills,asText(assessment.path("recommendations")),
                    application.getResumePath()!=null?"Uploaded resume":"Candidate profile and application",
                    false,false,""));
        }
        results.sort(Comparator.comparing(ApplicantScreeningResponse::matchScore,
                Comparator.nullsLast(Comparator.reverseOrder())));
        Integer highestScore=results.stream().map(ApplicantScreeningResponse::matchScore)
                .filter(score -> score!=null).max(Integer::compareTo).orElse(null);
        List<ApplicantScreeningResponse> notifiedResults=new ArrayList<>();
        for (ApplicantScreeningResponse result:results) {
            boolean topRanked=highestScore!=null && highestScore.equals(result.matchScore());
            if (!topRanked) {
                notifiedResults.add(result);
                continue;
            }
            Application application=applicationsById.get(result.applicationId());
            application.setApplicationStatus(ApplicationStatus.SHORTLISTED);
            boolean emailSent=application.getShortlistEmailSentAt()!=null;
            String emailMessage=emailSent?"Shortlist email was already sent.":"";
            if (!emailSent) {
                var deliveryResult=interviewInvitations.sendShortlistNotice(application,
                        application.getJob().getRecruiter().getUser().getName());
                emailSent=deliveryResult.isEmpty();
                emailMessage=deliveryResult.orElse("");
                if (emailSent) application.setShortlistEmailSentAt(Instant.now());
            }
            applications.save(application);
            notifiedResults.add(new ApplicantScreeningResponse(result.applicationId(),result.candidateName(),
                    ApplicationStatus.SHORTLISTED,result.resumeAttached(),result.matchScore(),result.matchingSkills(),
                    result.missingSkills(),result.recommendations(),result.screeningBasis(),true,emailSent,emailMessage));
        }
        return notifiedResults;
    }
    @PatchMapping("/{id}/status") @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApplicationResponse status(@PathVariable Long id,@RequestParam ApplicationStatus status,Authentication auth){
        Application a=applications.findById(id).orElseThrow();
        ensureJobOwner(a.getJob(),auth);
        a.setApplicationStatus(status);
        return ApplicationResponse.from(applications.save(a));
    }
    @PostMapping("/{id}/schedule-interview")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public InterviewScheduleResponse scheduleInterview(@PathVariable Long id,
                                                       @Valid @RequestBody InterviewScheduleRequest request,
                                                       Authentication auth) {
        Application application=applications.findById(id).orElseThrow();
        ensureJobOwner(application.getJob(),auth);
        application.setInterviewScheduledAt(request.scheduledAt());
        application.setInterviewTimeZone(request.timeZone());
        application.setInterviewDetails(request.details().trim());
        application.setApplicationStatus(ApplicationStatus.SHORTLISTED);
        Application saved=applications.save(application);
        var emailResult=interviewInvitations.send(saved,request,saved.getJob().getRecruiter().getUser().getName());
        return new InterviewScheduleResponse(ApplicationResponse.from(saved),emailResult.isEmpty(),
                emailResult.orElse(""));
    }
    @GetMapping("/{id}/resume") @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> resume(@PathVariable Long id,Authentication auth)throws Exception{
        Application application=applications.findById(id).orElseThrow();
        ensureJobOwner(application.getJob(),auth);
        String path=application.getResumePath();
        if(path==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"This application was submitted manually");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).body(fileStorage.read(path));
    }
    @GetMapping("/{id}/candidate-photo") @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> candidatePhoto(@PathVariable Long id, Authentication auth) throws Exception {
        Application application=applications.findById(id).orElseThrow();
        ensureJobOwner(application.getJob(),auth);
        String path=application.getCandidate().getPhotoPath();
        if(path==null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(fileStorage.contentType(path))).body(fileStorage.read(path));
    }
    private void ensureJobOwner(Job job,Authentication auth) {
        if (auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
                && !job.getRecruiter().getUser().getEmail().equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You cannot manage applications for another recruiter's job");
        }
    }
    private String screeningText(Application application) throws IOException {
        if (application.getResumePath()!=null) {
            try(PDDocument document=Loader.loadPDF(fileStorage.read(application.getResumePath()))) {
                return new PDFTextStripper().getText(document);
            }
        }
        Candidate candidate=application.getCandidate();
        return String.join("\n",nullToEmpty(candidate.getSkills()),nullToEmpty(candidate.getExperience()),
                nullToEmpty(candidate.getProfessionalSummary()),nullToEmpty(candidate.getEducation()),
                nullToEmpty(application.getCoverLetter()));
    }
    private String nullToEmpty(String value) { return value==null?"":value; }
    private String limit(String value,int maximumLength) {
        return value.length()<=maximumLength?value:value.substring(0,maximumLength);
    }
    private String asText(JsonNode value) {
        return value==null||value.isNull()||value.isMissingNode()?"":value.isTextual()?value.asText():value.toString();
    }
    private String skillEvidence(JsonNode modelValue,String requiredSkills,String resumeText,boolean matching) {
        List<String> supplied=new ArrayList<>();
        if (modelValue instanceof ArrayNode array) {
            array.forEach(item -> {
                if (item.isTextual() && !item.asText().isBlank()) supplied.add(item.asText().trim());
            });
        } else if (modelValue!=null && modelValue.isTextual()) {
            for (String item:modelValue.asText().split("[,;\\n]")) {
                if (!item.isBlank()) supplied.add(item.trim());
            }
        }
        if (!supplied.isEmpty()) return String.join(", ",supplied);

        String resume=resumeText.toLowerCase(java.util.Locale.ROOT);
        List<String> evidence=new ArrayList<>();
        for (String required:nullToEmpty(requiredSkills).split("[,;|\\n]")) {
            String skill=required.trim();
            if (skill.isEmpty()) continue;
            boolean present=resume.contains(skill.toLowerCase(java.util.Locale.ROOT));
            if (matching==present) evidence.add(skill);
        }
        return String.join(", ",evidence);
    }
}

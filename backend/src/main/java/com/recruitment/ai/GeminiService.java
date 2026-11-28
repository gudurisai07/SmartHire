package com.recruitment.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Base64;

@Service
@ConditionalOnProperty(name="app.ai.provider", havingValue="gemini", matchIfMissing=true)
public class GeminiService implements AiService {
    private static final String INTERACTIONS_ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/interactions";

    private final RestClient client;
    private final String apiKey;
    private final String model;
    private final List<String> fallbackModels;
    private final ObjectMapper mapper;

    @Autowired
    public GeminiService(@Value("${app.gemini.api-key}") String apiKey,
                         @Value("${app.gemini.model}") String model,
                         @Value("${app.gemini.fallback-models}") String fallbackModels,
                         ObjectMapper mapper) {
        this(apiKey, model, fallbackModels, mapper, RestClient.create());
    }

    GeminiService(String apiKey, String model, String fallbackModels,
                  ObjectMapper mapper, RestClient client) {
        this.apiKey=apiKey; this.model=model;
        this.fallbackModels=List.of(fallbackModels.split(",")).stream().map(String::trim)
                .filter(candidate -> !candidate.isBlank()).distinct().toList();
        this.mapper=mapper;
        this.client=client;
    }

    private JsonNode generateJson(String prompt, Map<String,Object> schema) {
        if (apiKey == null || apiKey.isBlank())
            throw new ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "GEMINI_API_KEY is not configured");
        Map<String,Object> body=Map.of(
                "model", model,
                "input", prompt+"\nReturn only valid JSON. Do not wrap the JSON in markdown.",
                "response_format", Map.of("type", "text", "mime_type", "application/json",
                        "schema", schema));
        String json=generateContent(body, "Gemini API request");
        JsonNode root;
        try {
            root=mapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Gemini returned an invalid response payload");
        }
        String text=outputText(root);
        try {
            return mapper.readTree(text);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Gemini did not return valid JSON");
        }
    }

    public String transcribeAudio(byte[] audio, String mimeType) {
        if (apiKey == null || apiKey.isBlank())
            throw new ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "GEMINI_API_KEY is not configured");
        Map<String,Object> body=Map.of("input",List.of(
                Map.of("type","text","text","Transcribe the spoken words in this audio accurately. Return only the transcript. Do not infer identity, emotion, accent, or other personal characteristics."),
                Map.of("type","audio","mime_type",mimeType,
                        "data",Base64.getEncoder().encodeToString(audio))));
        String json=generateContent(body, "Gemini speech transcription request");
        try {
            JsonNode root=mapper.readTree(json);
            String transcript=outputText(root);
            if(transcript.isBlank())
                throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                        "Gemini returned an empty transcript");
            return transcript;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Gemini returned an invalid transcription response", e);
        }
    }

    @Override public JsonNode analyzeResume(String resumeText) {
        return generateJson("Analyze this real resume using only explicit facts. Provide resumeQualityScore and atsScore from 0 to 100 using a fair rubric for readability, structure, measurable impact, skills relevance, and ATS parsing. Never invent resume facts. Resume:\n"+resumeText,
                resumeAnalysisSchema());
    }
    @Override public JsonNode matchResumeWithJob(String resumeText,String jobDescription) {
        return generateJson("Compare the real resume with the real job description and produce keys: overallMatchPercentage, matchingSkills, missingSkills, relevantExperience, qualificationCompatibility, jobRequirementCompatibility, recommendations. Resume:\n"+resumeText+"\nJob:\n"+jobDescription,
                resumeJobMatchSchema());
    }
    @Override public JsonNode screenApplicantWithJob(String resumeText, String jobDescription) {
        return generateJson("Assess the applicant only against job-related skills, qualifications, and experience. Ignore names and other personal characteristics. Return exactly one JSON object with overallMatchPercentage (integer 0-100), matchingSkills (string array), missingSkills (string array), and recommendations (one concise sentence). Resume:\n"+resumeText+"\nJob:\n"+jobDescription,
                applicantScreeningSchema());
    }
    @Override public JsonNode generateInterviewQuestions(String resumeText,String jobDescription,String category,String difficulty,int count) {
        return generateJson("Generate exactly "+count+" interview questions for category "+category+" at "+difficulty+" difficulty using the resume and job. Return a JSON object with questions array; each item has question, suggestedAnswer, followUpQuestions. Resume:\n"+resumeText+"\nJob:\n"+jobDescription,
                interviewQuestionsSchema());
    }
    @Override public JsonNode improveResume(String resumeText,String jobDescription) {
        return generateJson("Improve this resume for the selected role. Use only source facts; never invent employers, dates, degrees, achievements, metrics, or skills. Return JSON with keys improvedProfessionalSummary (string), improvedProjectDescriptions (array), improvedWorkExperience (array), improvedTechnicalSkills (array), grammarCorrections (array), missingKeywords (array of role keywords that are missing, explicitly marked as suggestions, not claims), recommendations (array). Original resume:\n"+resumeText+"\nTarget role:\n"+jobDescription,
                resumeImprovementSchema());
    }
    @Override public JsonNode generateLatexResume(String resumeText,String jobDescription,String templateId) {
        String style=switch (templateId) {
            case "modern" -> "modern single-column with strong headings and restrained blue accents";
            case "compact" -> "compact one-page ATS-first single-column with tight spacing";
            default -> "classic professional single-column ATS-friendly";
        };
        return generateJson("Create a complete compilable LaTeX resume using the requested style: "+style+". Target role: "+jobDescription+". Use only facts from source. Do not invent personal details, dates, employers, skills, or achievements. Escape LaTeX special characters. Avoid tables, columns, icons and graphics for ATS compatibility. Return JSON with keys latex (one complete source string using article class and common packages only), professionalSummary (string), improvements (array). Source resume:\n"+resumeText,
                latexResumeSchema());
    }
    @Override public JsonNode evaluateInterviewAnswer(String question,String answer,String skills,String jobRole) {
        return generateJson("Evaluate this actual answer. Return keys: score, strengths, weaknesses, missingKeyPoints, improvementSuggestions, sampleImprovedAnswer, relevance, technicalAccuracy, completeness, clarity. Question:"+question+"\nAnswer:"+answer+"\nSkills:"+skills+"\nRole:"+jobRole,
                interviewAnswerEvaluationSchema());
    }

    private static Map<String,Object> resumeAnalysisSchema() {
        Map<String,Object> properties=Map.ofEntries(
                Map.entry("professionalSummary", stringSchema()),
                Map.entry("technicalSkills", stringArraySchema()),
                Map.entry("education", stringArraySchema()),
                Map.entry("workExperience", stringArraySchema()),
                Map.entry("projects", stringArraySchema()),
                Map.entry("strengths", stringArraySchema()),
                Map.entry("weaknesses", stringArraySchema()),
                Map.entry("missingSkills", stringArraySchema()),
                Map.entry("resumeQualityScore", integerSchema()),
                Map.entry("atsScore", integerSchema()),
                Map.entry("formattingSuggestions", stringArraySchema()),
                Map.entry("recommendedImprovements", stringArraySchema()));
        return objectSchema(properties, "professionalSummary", "technicalSkills", "education",
                "workExperience", "projects", "strengths", "weaknesses", "missingSkills",
                "resumeQualityScore", "atsScore", "formattingSuggestions", "recommendedImprovements");
    }

    private static Map<String,Object> resumeJobMatchSchema() {
        return objectSchema(Map.of(
                "overallMatchPercentage", integerSchema(),
                "matchingSkills", stringArraySchema(),
                "missingSkills", stringArraySchema(),
                "relevantExperience", stringSchema(),
                "qualificationCompatibility", stringSchema(),
                "jobRequirementCompatibility", stringSchema(),
                "recommendations", stringSchema()),
                "overallMatchPercentage", "matchingSkills", "missingSkills", "relevantExperience",
                "qualificationCompatibility", "jobRequirementCompatibility", "recommendations");
    }

    private static Map<String,Object> applicantScreeningSchema() {
        return objectSchema(Map.of(
                "overallMatchPercentage", integerSchema(),
                "matchingSkills", stringArraySchema(),
                "missingSkills", stringArraySchema(),
                "recommendations", stringSchema()),
                "overallMatchPercentage", "matchingSkills", "missingSkills", "recommendations");
    }

    private static Map<String,Object> interviewQuestionsSchema() {
        Map<String,Object> questionSchema=objectSchema(Map.of(
                "question", stringSchema(),
                "suggestedAnswer", stringSchema(),
                "followUpQuestions", stringArraySchema()),
                "question", "suggestedAnswer", "followUpQuestions");
        return objectSchema(Map.of("questions", arraySchema(questionSchema)), "questions");
    }

    private static Map<String,Object> resumeImprovementSchema() {
        return objectSchema(Map.of(
                "improvedProfessionalSummary", stringSchema(),
                "improvedProjectDescriptions", stringArraySchema(),
                "improvedWorkExperience", stringArraySchema(),
                "improvedTechnicalSkills", stringArraySchema(),
                "grammarCorrections", stringArraySchema(),
                "missingKeywords", stringArraySchema(),
                "recommendations", stringArraySchema()),
                "improvedProfessionalSummary", "improvedProjectDescriptions", "improvedWorkExperience",
                "improvedTechnicalSkills", "grammarCorrections", "missingKeywords", "recommendations");
    }

    private static Map<String,Object> latexResumeSchema() {
        return objectSchema(Map.of(
                "latex", stringSchema(),
                "professionalSummary", stringSchema(),
                "improvements", stringArraySchema()),
                "latex", "professionalSummary", "improvements");
    }

    private static Map<String,Object> interviewAnswerEvaluationSchema() {
        return objectSchema(Map.of(
                "score", integerSchema(),
                "strengths", stringArraySchema(),
                "weaknesses", stringArraySchema(),
                "missingKeyPoints", stringArraySchema(),
                "improvementSuggestions", stringArraySchema(),
                "sampleImprovedAnswer", stringSchema(),
                "relevance", stringSchema(),
                "technicalAccuracy", stringSchema(),
                "completeness", stringSchema(),
                "clarity", stringSchema()),
                "score", "strengths", "weaknesses", "missingKeyPoints", "improvementSuggestions",
                "sampleImprovedAnswer", "relevance", "technicalAccuracy", "completeness", "clarity");
    }

    private static Map<String,Object> objectSchema(Map<String,Object> properties, String... required) {
        return Map.of("type", "object", "properties", properties, "required", List.of(required));
    }

    private static Map<String,Object> arraySchema(Map<String,Object> items) {
        return Map.of("type", "array", "items", items);
    }

    private static Map<String,Object> stringArraySchema() {
        return arraySchema(stringSchema());
    }

    private static Map<String,Object> stringSchema() {
        return Map.of("type", "string");
    }

    private static Map<String,Object> integerSchema() {
        return Map.of("type", "integer");
    }

    private String generateContent(Map<String,Object> body, String operation) {
        List<String> models = new ArrayList<>();
        models.add(model);
        for (String fallbackModel : fallbackModels) {
            if (!models.contains(fallbackModel)) {
                models.add(fallbackModel);
            }
        }
        for (int modelIndex = 0; modelIndex < models.size(); modelIndex++) {
            String requestModel = models.get(modelIndex);
            for (int attempt = 0; attempt < 2; attempt++) {
                try {
                    return client.post()
                            .uri(INTERACTIONS_ENDPOINT)
                            .header("x-goog-api-key", apiKey)
                            .header("Api-Revision", "2026-05-20")
                            .body(withModel(body, requestModel)).retrieve()
                            .body(String.class);
                } catch (RestClientResponseException e) {
                    int status = e.getStatusCode().value();
                    if ((status == 429 || status == 503) && attempt == 0) {
                        try {
                            Thread.sleep(1000L);
                        } catch (InterruptedException interrupted) {
                            Thread.currentThread().interrupt();
                            throw new ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                                    "Gemini retry was interrupted", interrupted);
                        }
                        continue;
                    }
                    if (status == 503 && modelIndex + 1 < models.size()) {
                        break;
                    }
                    throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                            operation+" failed for "+requestModel+" (HTTP "+status+"): "+providerError(e.getResponseBodyAsString()), e);
                }
            }
        }
        throw new IllegalStateException("Gemini model fallback ended unexpectedly");
    }

    private Map<String,Object> withModel(Map<String,Object> body, String requestModel) {
        Map<String,Object> request=new java.util.HashMap<>(body);
        request.put("model", requestModel);
        return request;
    }

    private String outputText(JsonNode root) {
        if (root==null) return "";
        String direct=root.path("output_text").asText(root.path("outputText").asText(""));
        if (!direct.isBlank()) return direct.trim();
        for (JsonNode step:root.path("steps")) {
            if (!"model_output".equals(step.path("type").asText())) continue;
            for (JsonNode content:step.path("content")) {
                String text=content.path("text").asText("").trim();
                if (!text.isBlank()) return text;
            }
        }
        return "";
    }

    private String providerError(String responseBody) {
        JsonNode root;
        try {
            root = mapper.readTree(responseBody);
        } catch (JsonProcessingException e) {
            return "Google returned an unreadable error response";
        }
        String message = root == null ? "" : root.path("error").path("message").asText("");
        if (message.isBlank()) {
            message = root == null ? "" : root.path("error").path("status").asText("");
        }
        if (message.isBlank()) {
            return "Google did not provide an error description";
        }
        if (apiKey != null && !apiKey.isBlank()) {
            message = message.replace(apiKey, "[redacted]");
        }
        return message.length() <= 300 ? message : message.substring(0, 300);
    }
}

package com.recruitment.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeminiServiceTest {
    private static final String INTERACTIONS_ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/interactions";

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void interviewGenerationUsesQuestionSchemaAndParsesInteractionOutput() throws Exception {
        RestClient.Builder builder=RestClient.builder();
        MockRestServiceServer server=MockRestServiceServer.bindTo(builder).build();
        String generatedQuestions=mapper.writeValueAsString(Map.of("questions", List.of(
                Map.of("question", "Describe your project.", "suggestedAnswer", "I built an app.",
                        "followUpQuestions", List.of("What was your role?")),
                Map.of("question", "How did you test it?", "suggestedAnswer", "I used automated tests.",
                        "followUpQuestions", List.of("What did the tests cover?")))));
        String providerResponse=mapper.writeValueAsString(Map.of("output_text", generatedQuestions));
        server.expect(requestTo(INTERACTIONS_ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.response_format.schema.required[0]").value("questions"))
                .andExpect(jsonPath("$.response_format.schema.properties.questions.type").value("array"))
                .andExpect(jsonPath("$.response_format.schema.properties.questions.items.properties.question.type")
                        .value("string"))
                .andExpect(jsonPath("$.response_format.schema.properties.professionalSummary").doesNotExist())
                .andRespond(withSuccess(providerResponse, MediaType.APPLICATION_JSON));

        GeminiService service=new GeminiService("test-key", "test-model", "", mapper, builder.build());
        JsonNode result=service.generateInterviewQuestions("resume", "job", "Technical", "Intermediate", 2);

        assertEquals(2, result.path("questions").size());
        assertEquals("Describe your project.", result.path("questions").get(0).path("question").asText());
        server.verify();
    }

    @Test
    void transcriptionUsesInteractionsAudioInputAndOutputText() throws Exception {
        RestClient.Builder builder=RestClient.builder();
        MockRestServiceServer server=MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(INTERACTIONS_ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.input[1].type").value("audio"))
                .andExpect(jsonPath("$.input[1].mime_type").value("audio/wav"))
                .andExpect(jsonPath("$.input[1].data").value(Base64.getEncoder().encodeToString(new byte[]{1, 2, 3})))
                .andExpect(jsonPath("$.contents").doesNotExist())
                .andRespond(withSuccess(mapper.writeValueAsString(
                        Map.of("output_text", "Turn left at the next street.")), MediaType.APPLICATION_JSON));

        GeminiService service=new GeminiService("test-key", "test-model", "", mapper, builder.build());

        assertEquals("Turn left at the next street.", service.transcribeAudio(new byte[]{1, 2, 3}, "audio/wav"));
        server.verify();
    }
}

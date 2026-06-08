import { descending } from "firebase/firestore/pipelines";

const routes = [
    { path: "/generate", description: "Start of the video generation process. The user uploads their documents and enters their prompts here" },
    { path: "/generate/edit", description: "Edit and modify features of video generation process" },
    { path: "/generate/review", description: "Review and evaluate the generated video" },
    { path: "/generate/final-video", description: "Watch and share the final video" }
];

export const navigateTool = {
    type: "function" as const,
    function: {
        name: "navigate_to_page",
        description: `Navigate the user to a different page. Available routes:\n${routes
            .map(r => `- ${r.path}: ${r.description}`)
            .join("\n")}`,
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "The route to navigate to",
                    enum: routes.map(r => r.path),
                },
                reason: {
                    type: "string",
                    description: "We need to move to the next step of the video generation process"
                },
            },
            required: ["path"],
        },
    },
};
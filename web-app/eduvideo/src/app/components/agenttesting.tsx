//This worked but it has to be run from the command line from the components folder for testing. 

import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "History tutor",
  instructions:
    "You answer history questions clearly and concisely.",
  model: "gpt-5.5",
});

async function main(){
  const result = await run(agent, "When did the Roman Empire fall?");
  console.log(result.finalOutput);
}

main();

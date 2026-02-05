The Gemini Deep Research Agent autonomously plans, executes, and synthesizes
multi-step research tasks. Powered by Gemini 3 Pro, it navigates complex
information landscapes using web search and your own data to produce detailed,
cited reports.

Research tasks involve iterative searching and reading and can take several
minutes to complete. You must use **background execution** (set `background=true`)
to run the agent asynchronously and poll for results. See [Handling long
running tasks](https://ai.google.dev/gemini-api/docs/deep-research#long-running-tasks) for more details.
| **Preview:** The Gemini Deep Research Agent is currently in preview. The Deep Research agent is exclusively available using the [Interactions
| API](https://ai.google.dev/gemini-api/docs/interactions). You cannot access it through `generate_content`.

The following example shows how to start a research task in the background
and poll for results.  

### Python

    import time
    from google import genai

    client = genai.Client()

    interaction = client.interactions.create(
        input="Research the history of Google TPUs.",
        agent='deep-research-pro-preview-12-2025',
        background=True
    )

    print(f"Research started: {interaction.id}")

    while True:
        interaction = client.interactions.get(interaction.id)
        if interaction.status == "completed":
            print(interaction.outputs[-1].text)
            break
        elif interaction.status == "failed":
            print(f"Research failed: {interaction.error}")
            break
        time.sleep(10)

### JavaScript

    import { GoogleGenAI } from '@google/genai';

    const client = new GoogleGenAI({});

    const interaction = await client.interactions.create({
        input: 'Research the history of Google TPUs.',
        agent: 'deep-research-pro-preview-12-2025',
        background: true
    });

    console.log(`Research started: ${interaction.id}`);

    while (true) {
        const result = await client.interactions.get(interaction.id);
        if (result.status === 'completed') {
            console.log(result.outputs[result.outputs.length - 1].text);
            break;
        } else if (result.status === 'failed') {
            console.log(`Research failed: ${result.error}`);
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

### REST

    # 1. Start the research task
    curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -d '{
        "input": "Research the history of Google TPUs.",
        "agent": "deep-research-pro-preview-12-2025",
        "background": true
    }'

    # 2. Poll for results (Replace INTERACTION_ID)
    # curl -X GET "https://generativelanguage.googleapis.com/v1beta/interactions/INTERACTION_ID" \
    # -H "x-goog-api-key: $GEMINI_API_KEY"

## Research with your own data

Deep Research has access to a variety of tools. By default, the agent has access
to information on the public internet using the `google_search` and `url_context`
tool. You don't need to specify these tools by default. However, if you
additionally want to give the agent access to your own data by using the [File
Search](https://ai.google.dev/gemini-api/docs/file-search) tool you will need to add it as shown in
the following example.
**Experimental:** Using Deep Research with `file_search` is still experimental.  

### Python

    import time
    from google import genai

    client = genai.Client()

    interaction = client.interactions.create(
        input="Compare our 2025 fiscal year report against current public web news.",
        agent="deep-research-pro-preview-12-2025",
        background=True,
        tools=[
            {
                "type": "file_search",
                "file_search_store_names": ['fileSearchStores/my-store-name']
            }
        ]
    )

### JavaScript

    const interaction = await client.interactions.create({
        input: 'Compare our 2025 fiscal year report against current public web news.',
        agent: 'deep-research-pro-preview-12-2025',
        background: true,
        tools: [
            { type: 'file_search', file_search_store_names: ['fileSearchStores/my-store-name'] },
        ]
    });

### REST

    curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -d '{
        "input": "Compare our 2025 fiscal year report against current public web news.",
        "agent": "deep-research-pro-preview-12-2025",
        "background": true,
        "tools": [
            {"type": "file_search", "file_search_store_names": ["fileSearchStores/my-store-name"]},
        ]
    }'

## Steerability and formatting

You can steer the agent's output by providing specific formatting instructions
in your prompt. This allows you to structure reports into specific sections and
subsections, include data tables, or adjust tone for different audiences (e.g.,
"technical," "executive," "casual").

Define the desired output format explicitly in your input text.  

### Python

    prompt = """
    Research the competitive landscape of EV batteries.

    Format the output as a technical report with the following structure:
    1. Executive Summary
    2. Key Players (Must include a data table comparing capacity and chemistry)
    3. Supply Chain Risks
    """

    interaction = client.interactions.create(
        input=prompt,
        agent="deep-research-pro-preview-12-2025",
        background=True
    )

### JavaScript

    const prompt = `
    Research the competitive landscape of EV batteries.

    Format the output as a technical report with the following structure:
    1. Executive Summary
    2. Key Players (Must include a data table comparing capacity and chemistry)
    3. Supply Chain Risks
    `;

    const interaction = await client.interactions.create({
        input: prompt,
        agent: 'deep-research-pro-preview-12-2025',
        background: true,
    });

### REST

    curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -d '{
        "input": "Research the competitive landscape of EV batteries.\n\nFormat the output as a technical report with the following structure: \n1. Executive Summary\n2. Key Players (Must include a data table comparing capacity and chemistry)\n3. Supply Chain Risks",
        "agent": "deep-research-pro-preview-12-2025",
        "background": true

## Multimodal inputs

Deep Research supports multimodal inputs, including images, PDFs, audio, and video,
allowing the agent to analyze rich content and then conduct web-based research
contextualized by the provided inputs. For example, you can provide a photograph
and ask the agent to identify subjects, research their behavior, or find related information.

The following example demonstrates an image analysis request using an
image URL.  

### Python

    import time
    from google import genai

    client = genai.Client()

    prompt = '''Analyze the interspecies dynamics and behavioral risks present
    in the provided image of the African watering hole. Specifically, investigate
    the symbiotic relationship between the avian species and the pachyderms
    shown, and conduct a risk assessment for the reticulated giraffes based on
    their drinking posture relative to the specific predator visible in the
    foreground.'''

    interaction = client.interactions.create(
        input=[
            {"type": "text", "text": prompt},
            {
                "type": "image",
                "uri": "https://storage.googleapis.com/generativeai-downloads/images/generated_elephants_giraffes_zebras_sunset.jpg"
            }
        ],
        agent="deep-research-pro-preview-12-2025",
        background=True
    )

    print(f"Research started: {interaction.id}")

    while True:
        interaction = client.interactions.get(interaction.id)
        if interaction.status == "completed":
            print(interaction.outputs[-1].text)
            break
        elif interaction.status == "failed":
            print(f"Research failed: {interaction.error}")
            break
        time.sleep(10)

### JavaScript

    import { GoogleGenAI } from '@google/genai';

    const client = new GoogleGenAI({});

    const prompt = `Analyze the interspecies dynamics and behavioral risks present
    in the provided image of the African watering hole. Specifically, investigate
    the symbiotic relationship between the avian species and the pachyderms
    shown, and conduct a risk assessment for the reticulated giraffes based on
    their drinking posture relative to the specific predator visible in the
    foreground.`;

    const interaction = await client.interactions.create({
        input: [
            { type: 'text', text: prompt },
            {
                type: 'image',
                uri: 'https://storage.googleapis.com/generativeai-downloads/images/generated_elephants_giraffes_zebras_sunset.jpg'
            }
        ],
        agent: 'deep-research-pro-preview-12-2025',
        background: true
    });

    console.log(`Research started: ${interaction.id}`);

    while (true) {
        const result = await client.interactions.get(interaction.id);
        if (result.status === 'completed') {
            console.log(result.outputs[result.outputs.length - 1].text);
            break;
        } else if (result.status === 'failed') {
            console.log(`Research failed: ${result.error}`);
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

### REST

    # 1. Start the research task with image input
    curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -d '{
        "input": [
            {"type": "text", "text": "Analyze the interspecies dynamics and behavioral risks present in the provided image of the African watering hole. Specifically, investigate the symbiotic relationship between the avian species and the pachyderms shown, and conduct a risk assessment for the reticulated giraffes based on their drinking posture relative to the specific predator visible in the foreground."},
            {"type": "image", "uri": "https://storage.googleapis.com/generativeai-downloads/images/generated_elephants_giraffes_zebras_sunset.jpg"}
        ],
        "agent": "deep-research-pro-preview-12-2025",
        "background": true
    }'

    # 2. Poll for results (Replace INTERACTION_ID)
    # curl -X GET "https://generativelanguage.googleapis.com/v1beta/interactions/INTERACTION_ID" \
    # -H "x-goog-api-key: $GEMINI_API_KEY"

## Handling long-running tasks

Deep Research is a multi-step process involving planning, searching, reading,
and writing. This cycle typically exceeds the standard timeout limits of
synchronous API calls.

Agents are required to use `background=True`. The API returns a partial
`Interaction` object immediately. You can use the `id` property to retrieve an
interaction for polling. The interaction state will transition from
`in_progress` to `completed` or `failed`.

### Streaming

Deep Research supports streaming to receive real-time updates on the research
progress. You must set `stream=True` and `background=True`.
| **Note:** To receive intermediate reasoning steps (thoughts) and progress updates, you must enable **thinking summaries** in the `agent_config`. If this is not set to `"auto"`, the stream may only provide the final results without the real-time thought process.

The following example shows how to start a research task and process the stream.
Crucially, it demonstrates how to track the `interaction_id` from the
`interaction.start` event. You will need this ID to resume the stream if a
network interruption occurs. This code also introduces an `event_id` variable
which lets you resume from the specific point where you disconnected.  

### Python

    stream = client.interactions.create(
        input="Research the history of Google TPUs.",
        agent="deep-research-pro-preview-12-2025",
        background=True,
        stream=True,
        agent_config={
            "type": "deep-research",
            "thinking_summaries": "auto"
        }
    )

    interaction_id = None
    last_event_id = None

    for chunk in stream:
        if chunk.event_type == "interaction.start":
            interaction_id = chunk.interaction.id
            print(f"Interaction started: {interaction_id}")

        if chunk.event_id:
            last_event_id = chunk.event_id

        if chunk.event_type == "content.delta":
            if chunk.delta.type == "text":
                print(chunk.delta.text, end="", flush=True)
            elif chunk.delta.type == "thought_summary":
                print(f"Thought: {chunk.delta.content.text}", flush=True)

        elif chunk.event_type == "interaction.complete":
            print("\nResearch Complete")

### JavaScript

    const stream = await client.interactions.create({
        input: 'Research the history of Google TPUs.',
        agent: 'deep-research-pro-preview-12-2025',
        background: true,
        stream: true,
        agent_config: {
            type: 'deep-research',
            thinking_summaries: 'auto'
        }
    });

    let interactionId;
    let lastEventId;

    for await (const chunk of stream) {
        // 1. Capture Interaction ID
        if (chunk.event_type === 'interaction.start') {
            interactionId = chunk.interaction.id;
            console.log(`Interaction started: ${interactionId}`);
        }

        // 2. Track IDs for potential reconnection
        if (chunk.event_id) lastEventId = chunk.event_id;

        // 3. Handle Content
        if (chunk.event_type === 'content.delta') {
            if (chunk.delta.type === 'text') {
                process.stdout.write(chunk.delta.text);
            } else if (chunk.delta.type === 'thought_summary') {
                console.log(`Thought: ${chunk.delta.content.text}`);
            }
        } else if (chunk.event_type === 'interaction.complete') {
            console.log('\nResearch Complete');
        }
    }

### REST

    curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -d '{
        "input": "Research the history of Google TPUs.",
        "agent": "deep-research-pro-preview-12-2025",
        "background": true,
        "stream": true,
        "agent_config": {
            "type": "deep-research",
            "thinking_summaries": "auto"
        }
    }'
    # Note: Look for the 'interaction.start' event to get the interaction ID.

### Reconnecting to stream

Network interruptions can occur during long-running research tasks. To handle
this gracefully, your application should catch connection errors and resume the
stream using `client.interactions.get()`.

You must provide two values to resume:

1. **Interaction ID:** Acquired from the `interaction.start` event in the initial stream.
2. **Last Event ID:** The ID of the last successfully processed event. This tells the server to resume sending events *after* that specific point. If not provided, you will get the beginning of the stream.

The following examples demonstrate a resilient pattern: attempting to stream the
initial `create` request, and falling back to a `get` loop if the connection
drops.  

### Python

    import time
    from google import genai

    client = genai.Client()

    # Configuration
    agent_name = 'deep-research-pro-preview-12-2025'
    prompt = 'Compare golang SDK test frameworks'

    # State tracking
    last_event_id = None
    interaction_id = None
    is_complete = False

    def process_stream(event_stream):
        """Helper to process events from any stream source."""
        global last_event_id, interaction_id, is_complete
        for event in event_stream:
            # Capture Interaction ID
            if event.event_type == "interaction.start":
                interaction_id = event.interaction.id
                print(f"Interaction started: {interaction_id}")

            # Capture Event ID
            if event.event_id:
                last_event_id = event.event_id

            # Print content
            if event.event_type == "content.delta":
                if event.delta.type == "text":
                    print(event.delta.text, end="", flush=True)
                elif event.delta.type == "thought_summary":
                    print(f"Thought: {event.delta.content.text}", flush=True)

            # Check completion
            if event.event_type in ['interaction.complete', 'error']:
                is_complete = True

    # 1. Attempt initial streaming request
    try:
        print("Starting Research...")
        initial_stream = client.interactions.create(
            input=prompt,
            agent=agent_name,
            background=True,
            stream=True,
            agent_config={
                "type": "deep-research",
                "thinking_summaries": "auto"
            }
        )
        process_stream(initial_stream)
    except Exception as e:
        print(f"\nInitial connection dropped: {e}")

    # 2. Reconnection Loop
    # If the code reaches here and is_complete is False, we resume using .get()
    while not is_complete and interaction_id:
        print(f"\nConnection lost. Resuming from event {last_event_id}...")
        time.sleep(2) 

        try:
            resume_stream = client.interactions.get(
                id=interaction_id,
                stream=True,
                last_event_id=last_event_id
            )
            process_stream(resume_stream)
        except Exception as e:
            print(f"Reconnection failed, retrying... ({e})")

### JavaScript

    let lastEventId;
    let interactionId;
    let isComplete = false;

    // Helper to handle the event logic
    const handleStream = async (stream) => {
        for await (const chunk of stream) {
            if (chunk.event_type === 'interaction.start') {
                interactionId = chunk.interaction.id;
            }
            if (chunk.event_id) lastEventId = chunk.event_id;

            if (chunk.event_type === 'content.delta') {
                if (chunk.delta.type === 'text') {
                    process.stdout.write(chunk.delta.text);
                } else if (chunk.delta.type === 'thought_summary') {
                    console.log(`Thought: ${chunk.delta.content.text}`);
                }
            } else if (chunk.event_type === 'interaction.complete') {
                isComplete = true;
            }
        }
    };

    // 1. Start the task with streaming
    try {
        const stream = await client.interactions.create({
            input: 'Compare golang SDK test frameworks',
            agent: 'deep-research-pro-preview-12-2025',
            background: true,
            stream: true,
            agent_config: {
                type: 'deep-research',
                thinking_summaries: 'auto'
            }
        });
        await handleStream(stream);
    } catch (e) {
        console.log('\nInitial stream interrupted.');
    }

    // 2. Reconnect Loop
    while (!isComplete && interactionId) {
        console.log(`\nReconnecting to interaction ${interactionId} from event ${lastEventId}...`);
        try {
            const stream = await client.interactions.get(interactionId, {
                stream: true,
                last_event_id: lastEventId
            });
            await handleStream(stream);
        } catch (e) {
            console.log('Reconnection failed, retrying in 2s...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

### REST

    # 1. Start the research task (Initial Stream)
    # Watch for event: interaction.start to get the INTERACTION_ID
    # Watch for "event_id" fields to get the LAST_EVENT_ID
    curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -d '{
        "input": "Compare golang SDK test frameworks",
        "agent": "deep-research-pro-preview-12-2025",
        "background": true,
        "stream": true,
        "agent_config": {
            "type": "deep-research",
            "thinking_summaries": "auto"
        }
    }'

    # ... Connection interrupted ...

    # 2. Reconnect (Resume Stream)
    # Pass the INTERACTION_ID and the LAST_EVENT_ID you saved.
    curl -X GET "https://generativelanguage.googleapis.com/v1beta/interactions/INTERACTION_ID?stream=true&last_event_id=LAST_EVENT_ID&alt=sse" \
    -H "x-goog-api-key: $GEMINI_API_KEY"

## Follow-up questions and interactions

You can continue the conversation after the agent returns the final report by
using the `previous_interaction_id`. This lets you to ask for clarification,
summarization or elaboration on specific sections of the research without
restarting the entire task.  

### Python

    import time
    from google import genai

    client = genai.Client()

    interaction = client.interactions.create(
        input="Can you elaborate on the second point in the report?",
        model="gemini-3-pro-preview",
        previous_interaction_id="COMPLETED_INTERACTION_ID"
    )

    print(interaction.outputs[-1].text)

### JavaScript

    const interaction = await client.interactions.create({
        input: 'Can you elaborate on the second point in the report?',
        agent: 'deep-research-pro-preview-12-2025',
        previous_interaction_id: 'COMPLETED_INTERACTION_ID'
    });
    console.log(interaction.outputs[-1].text);

### REST

    curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -d '{
        "input": "Can you elaborate on the second point in the report?",
        "agent": "deep-research-pro-preview-12-2025",
        "previous_interaction_id": "COMPLETED_INTERACTION_ID"
    }'

## When to use Gemini Deep Research Agent

Deep Research is an **agent**, not just a model. It is best suited for workloads
that require an "analyst-in-a-box" approach rather than low-latency chat.

| Feature | Standard Gemini Models | Gemini Deep Research Agent |
|---|---|---|
| **Latency** | Seconds | Minutes (Async/Background) |
| **Process** | Generate -\> Output | Plan -\> Search -\> Read -\> Iterate -\> Output |
| **Output** | Conversational text, code, short summaries | Detailed reports, long-form analysis, comparative tables |
| **Best For** | Chatbots, extraction, creative writing | Market analysis, due diligence, literature reviews, competitive landscaping |

## Availability and pricing

You can access the Gemini Deep Research Agent using the Interactions API in Google AI Studio and the Gemini API.

Pricing follows a [pay-as-you-go model](https://ai.google.dev/gemini-api/docs/pricing#pricing-for-agents) based on the underlying [Gemini 3 Pro](https://ai.google.dev/gemini-api/docs/pricing#gemini-3-pro-preview) model and the specific tools the agent utilizes. Unlike standard chat requests, where a request leads to one output, a Deep Research task is an agentic workflow. A single request triggers an autonomous loop of planning, searching, reading, and reasoning.

### Estimated costs

Costs vary based on the depth of research required. The agent autonomously determines how much reading and searching is necessary to answer your prompt.

- **Standard research task:** For a typical query requiring moderate analysis, the agent might use \~80 search queries, \~250k input tokens (\~50-70% cached), and \~60k output tokens.
  - **Estimated total:** \~$2.00 -- $3.00 per task
- **Complex research task:** For deep competitive landscape analysis or extensive due diligence, the agent might use up to \~160 search queries, \~900k input tokens (\~50-70% cached), and \~80k output tokens.
  - **Estimated total:** \~$3.00 -- $5.00 per task

| **Note:** These figures are estimates based on preview rates and are subject to change.

## Safety considerations

Giving an agent access to the web and your private files requires careful
consideration of safety risks.

- **Prompt injection using files:** The agent reads the contents of the files you provide. Ensure that uploaded documents (PDFs, text files) come from trusted sources. A malicious file could contain hidden text designed to manipulate the agent's output.
- **Web content risks:** The agent searches the public web. While we implement robust safety filters, there is a risk that the agent may encounter and process malicious web pages. We recommend reviewing the `citations` provided in the response to verify the sources.
- **Exfiltration:** Be cautious when asking the agent to summarize sensitive internal data if you are also allowing it to browse the web.

## Best practices

- **Prompt for unknowns:** Instruct the agent on how to handle missing data. For example, add *"If specific figures for 2025 are not available,
  explicitly state they are projections or unavailable rather than
  estimating"* to your prompt.
- **Provide context:** Ground the agent's research by providing background information or constraints directly in the input prompt.
- **Multimodal inputs** Deep Research Agent supports multi-modal inputs. Use cautiously, as this increases costs and risks context window overflow.

## Limitations

- **Beta status**: The Interactions API is in public beta. Features and schemas may change.
- **Custom tools:** You cannot currently provide custom Function Calling tools or remote MCP (Model Context Protocol) servers to the Deep Research agent.
- **Structured output and plan approval:** The Deep Research Agent currently doesn't support human approved planning or structured outputs.
- **Max research time:** The Deep Research agent has a maximum research time of 60 minutes. Most tasks should complete within 20 minutes.
- **Store requirement:** Agent execution using `background=True` requires `store=True`.
- **Google search:** [Google
  Search](https://ai.google.dev/gemini-api/docs/google-search) is enabled by default and [specific
  restrictions](https://ai.google.dev/gemini-api/terms#use-restrictions2) apply to the grounded results.
- **Audio inputs:** Audio inputs are not supported.

## What's next

- Learn more about the [Interactions API](https://ai.google.dev/gemini-api/docs/interactions).
- Read about the [Gemini 3 Pro](https://ai.google.dev/gemini-api/docs/models/gemini-3) model that powers this agent.
- Learn how to use your own data using the [File Search](https://ai.google.dev/gemini-api/docs/file-search) tool.

---
The Gemini API enables Retrieval Augmented Generation ("RAG") through the File
Search tool. File Search imports, chunks, and indexes your data to
enable fast retrieval of relevant information based on a provided prompt. This
information is then used as context for the model, allowing the model to
provide more accurate and relevant answers.

To make File Search simple and affordable for developers, we're making file storage
and embedding generation at query time free of charge. You only pay for creating
embeddings when you first index your files (at the applicable embedding model cost)
and the normal Gemini model input / output tokens cost. This new billing paradigm
makes the File Search Tool both easier and more cost-effective to build and scale
with.

## Directly upload to File Search store

This examples shows how to directly upload a file to the [file search store](https://ai.google.dev/api/file-search/file-search-stores#method:-media.uploadtofilesearchstore):  

### Python

    from google import genai
    from google.genai import types
    import time

    client = genai.Client()

    # File name will be visible in citations
    file_search_store = client.file_search_stores.create(config={'display_name': 'your-fileSearchStore-name'})

    operation = client.file_search_stores.upload_to_file_search_store(
      file='sample.txt',
      file_search_store_name=file_search_store.name,
      config={
          'display_name' : 'display-file-name',
      }
    )

    while not operation.done:
        time.sleep(5)
        operation = client.operations.get(operation)

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="""Can you tell me about [insert question]""",
        config=types.GenerateContentConfig(
            tools=[
                types.Tool(
                    file_search=types.FileSearch(
                        file_search_store_names=[file_search_store.name]
                    )
                )
            ]
        )
    )

    print(response.text)

### JavaScript

    const { GoogleGenAI } = require('@google/genai');

    const ai = new GoogleGenAI({});

    async function run() {
      // File name will be visible in citations
      const fileSearchStore = await ai.fileSearchStores.create({
        config: { displayName: 'your-fileSearchStore-name' }
      });

      let operation = await ai.fileSearchStores.uploadToFileSearchStore({
        file: 'file.txt',
        fileSearchStoreName: fileSearchStore.name,
        config: {
          displayName: 'file-name',
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.get({ operation });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Can you tell me about [insert question]",
        config: {
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: [fileSearchStore.name]
              }
            }
          ]
        }
      });

      console.log(response.text);
    }

    run();

Check the API reference for [`uploadToFileSearchStore`](https://ai.google.dev/api/file-search/file-search-stores#method:-media.uploadtofilesearchstore) for more information.

## Importing files

Alternatively, you can upload an existing file and [import it to your file search store](https://ai.google.dev/api/file-search/file-search-stores#method:-filesearchstores.importfile):  

### Python

    from google import genai
    from google.genai import types
    import time

    client = genai.Client()

    # File name will be visible in citations
    sample_file = client.files.upload(file='sample.txt', config={'name': 'display_file_name'})

    file_search_store = client.file_search_stores.create(config={'display_name': 'your-fileSearchStore-name'})

    operation = client.file_search_stores.import_file(
        file_search_store_name=file_search_store.name,
        file_name=sample_file.name
    )

    while not operation.done:
        time.sleep(5)
        operation = client.operations.get(operation)

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="""Can you tell me about [insert question]""",
        config=types.GenerateContentConfig(
            tools=[
                types.Tool(
                    file_search=types.FileSearch(
                        file_search_store_names=[file_search_store.name]
                    )
                )
            ]
        )
    )

    print(response.text)

### JavaScript

    const { GoogleGenAI } = require('@google/genai');

    const ai = new GoogleGenAI({});

    async function run() {
      // File name will be visible in citations
      const sampleFile = await ai.files.upload({
        file: 'sample.txt',
        config: { name: 'file-name' }
      });

      const fileSearchStore = await ai.fileSearchStores.create({
        config: { displayName: 'your-fileSearchStore-name' }
      });

      let operation = await ai.fileSearchStores.importFile({
        fileSearchStoreName: fileSearchStore.name,
        fileName: sampleFile.name
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.get({ operation: operation });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Can you tell me about [insert question]",
        config: {
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: [fileSearchStore.name]
              }
            }
          ]
        }
      });

      console.log(response.text);
    }

    run();

Check the API reference for [`importFile`](https://ai.google.dev/api/file-search/file-search-stores#method:-filesearchstores.importfile) for more information.

## Chunking configuration

When you import a file into a File Search store, it's automatically broken down
into chunks, embedded, indexed, and uploaded to your File Search store. If you
need more control over the chunking strategy, you can specify a
[`chunking_config`](https://ai.google.dev/api/file-search/file-search-stores#request-body_5) setting
to set a maximum number of tokens per chunk and maximum number of overlapping
tokens.  

### Python

    from google import genai
    from google.genai import types
    import time

    client = genai.Client()

    operation = client.file_search_stores.upload_to_file_search_store(
        file_search_store_name=file_search_store.name,
        file_name=sample_file.name,
        config={
            'chunking_config': {
              'white_space_config': {
                'max_tokens_per_chunk': 200,
                'max_overlap_tokens': 20
              }
            }
        }
    )

    while not operation.done:
        time.sleep(5)
        operation = client.operations.get(operation)

    print("Custom chunking complete.")

### JavaScript

    const { GoogleGenAI } = require('@google/genai');

    const ai = new GoogleGenAI({});

    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: 'file.txt',
      fileSearchStoreName: fileSearchStore.name,
      config: {
        displayName: 'file-name',
        chunkingConfig: {
          whiteSpaceConfig: {
            maxTokensPerChunk: 200,
            maxOverlapTokens: 20
          }
        }
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.get({ operation });
    }
    console.log("Custom chunking complete.");

To use your File Search store, pass it as a tool to the `generateContent`
method, as shown in the [Upload](https://ai.google.dev/gemini-api/docs/file-search#upload) and [Import](https://ai.google.dev/gemini-api/docs/file-search#importing-files) examples.

## How it works

File Search uses a technique called semantic search to find information relevant
to the user prompt. Unlike standard keyword-based search, semantic search
understands the meaning and context of your query.

When you import a file, it's converted into numerical representations called
[embeddings](https://ai.google.dev/gemini-api/docs/embeddings), which capture the semantic meaning of
the text. These embeddings are stored in a specialized File Search database.
When you make a query, it's also converted into an embedding. Then the system
performs a File Search to find the most similar and relevant document chunks
from the File Search store.

There is no Time To Live (TTL) for embeddings and files;
they persist until manually deleted, or when the model is deprecated.

Here's a breakdown of the process for using the File Search
`uploadToFileSearchStore` API:

1. **Create a File Search store**: A File Search store contains the processed
   data from your files. It's the persistent container for the embeddings that the
   semantic search will operate on.

2. **Upload a file and import into a File Search store** : Simultaneously upload
   a file and import the results into your File Search store. This creates a
   temporary `File` object, which is a reference to your raw document. That data is
   then chunked, converted into File Search embeddings, and indexed. The `File`
   object gets deleted after 48 hours, while the data imported into the File Search
   store will be stored indefinitely until you choose to delete it.

3. **Query with File Search** : Finally, you use the `FileSearch` tool in a
   `generateContent` call. In the tool configuration, you specify a
   `FileSearchRetrievalResource`, which points to the `FileSearchStore` you want to
   search. This tells the model to perform a semantic search on that specific
   File Search store to find relevant information to ground its response.

![The indexing and querying process of File Search](https://ai.google.dev/static/gemini-api/docs/images/File-search.png) The indexing and querying process of File Search

In this diagram, the dotted line from from *Documents* to *Embedding model*
(using [`gemini-embedding-001`](https://ai.google.dev/gemini-api/docs/embeddings))
represents the `uploadToFileSearchStore` API (bypassing *File storage* ).
Otherwise, using the [Files API](https://ai.google.dev/gemini-api/docs/files) to separately create
and then import files moves the indexing process from *Documents* to
*File storage* and then to *Embedding model*.

## File Search stores

A File Search store is a container for your document embeddings. While raw files
uploaded through the File API are deleted after 48 hours, the data imported into
a File Search store is stored indefinitely until you manually delete it. You can
create multiple File Search stores to organize your documents. The
`FileSearchStore` API lets you create, list, get, and delete to manage your file
search stores. File Search store names are globally scoped.

Here are some examples of how to manage your File Search stores:  

### Python

    file_search_store = client.file_search_stores.create(config={'display_name': 'my-file_search-store-123'})

    for file_search_store in client.file_search_stores.list():
        print(file_search_store)

    my_file_search_store = client.file_search_stores.get(name='fileSearchStores/my-file_search-store-123')

    client.file_search_stores.delete(name='fileSearchStores/my-file_search-store-123', config={'force': True})

### JavaScript

    const fileSearchStore = await ai.fileSearchStores.create({
      config: { displayName: 'my-file_search-store-123' }
    });

    const fileSearchStores = await ai.fileSearchStores.list();
    for await (const store of fileSearchStores) {
      console.log(store);
    }

    const myFileSearchStore = await ai.fileSearchStores.get({
      name: 'fileSearchStores/my-file_search-store-123'
    });

    await ai.fileSearchStores.delete({
      name: 'fileSearchStores/my-file_search-store-123',
      config: { force: true }
    });

### REST

    curl -X POST "https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=${GEMINI_API_KEY}" \
        -H "Content-Type: application/json"
        -d '{ "displayName": "My Store" }'

    curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=${GEMINI_API_KEY}" \

    curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores/my-file_search-store-123?key=${GEMINI_API_KEY}"

    curl -X DELETE "https://generativelanguage.googleapis.com/v1beta/fileSearchStores/my-file_search-store-123?key=${GEMINI_API_KEY}"

## File search documents

You can manage individual documents in your file stores with the
[File Search Documents](https://ai.google.dev/api/file-search/documents) API to `list` each document
in a file search store, `get` information about a document, and `delete` a
document by name.  

### Python

    for document_in_store in client.file_search_stores.documents.list(parent='fileSearchStores/my-file_search-store-123'):
      print(document_in_store)

    file_search_document = client.file_search_stores.documents.get(name='fileSearchStores/my-file_search-store-123/documents/my_doc')
    print(file_search_document)

    client.file_search_stores.documents.delete(name='fileSearchStores/my-file_search-store-123/documents/my_doc')

### JavaScript

    const documents = await ai.fileSearchStores.documents.list({
      parent: 'fileSearchStores/my-file_search-store-123'
    });
    for await (const doc of documents) {
      console.log(doc);
    }

    const fileSearchDocument = await ai.fileSearchStores.documents.get({
      name: 'fileSearchStores/my-file_search-store-123/documents/my_doc'
    });

    await ai.fileSearchStores.documents.delete({
      name: 'fileSearchStores/my-file_search-store-123/documents/my_doc'
    });

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores/my-file_search-store-123/documents?key=${GEMINI_API_KEY}"

    curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores/my-file_search-store-123/documents/my_doc?key=${GEMINI_API_KEY}"

    curl -X DELETE "https://generativelanguage.googleapis.com/v1beta/fileSearchStores/my-file_search-store-123/documents/my_doc?key=${GEMINI_API_KEY}"

## File metadata

You can add custom metadata to your files to help filter them or provide
additional context. Metadata is a set of key-value pairs.  

### Python

    op = client.file_search_stores.import_file(
        file_search_store_name=file_search_store.name,
        file_name=sample_file.name,
        custom_metadata=[
            {"key": "author", "string_value": "Robert Graves"},
            {"key": "year", "numeric_value": 1934}
        ]
    )

### JavaScript

    let operation = await ai.fileSearchStores.importFile({
      fileSearchStoreName: fileSearchStore.name,
      fileName: sampleFile.name,
      config: {
        customMetadata: [
          { key: "author", stringValue: "Robert Graves" },
          { key: "year", numericValue: 1934 }
        ]
      }
    });

This is useful when you have multiple documents in a File Search store and want
to search only a subset of them.  

### Python

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="Tell me about the book 'I, Claudius'",
        config=types.GenerateContentConfig(
            tools=[
                types.Tool(
                    file_search=types.FileSearch(
                        file_search_store_names=[file_search_store.name],
                        metadata_filter="author=Robert Graves",
                    )
                )
            ]
        )
    )

    print(response.text)

### JavaScript

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Tell me about the book 'I, Claudius'",
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [fileSearchStore.name],
              metadataFilter: 'author="Robert Graves"',
            }
          }
        ]
      }
    });

    console.log(response.text);

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}" \
        -H 'Content-Type: application/json' \
        -X POST \
        -d '{
                "contents": [{
                    "parts":[{"text": "Tell me about the book I, Claudius"}]
                }],
                "tools": [{
                    "file_search": {
                        "file_search_store_names":["'$STORE_NAME'"],
                        "metadata_filter": "author = \"Robert Graves\""
                    }
                }]
            }' 2> /dev/null > response.json

    cat response.json

Guidance on implementing list filter syntax for `metadata_filter` can be found
at [google.aip.dev/160](https://google.aip.dev/160)

## Citations

When you use File Search, the model's response may include citations that
specify which parts of your uploaded documents were used to generate the
answer. This helps with fact-checking and verification.

You can access citation information through the `grounding_metadata` attribute
of the response.  

### Python

    print(response.candidates[0].grounding_metadata)

### JavaScript

    console.log(JSON.stringify(response.candidates?.[0]?.groundingMetadata, null, 2));

## Structured output

Starting with Gemini 3 models, you can combine file search tool with
[structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).  

### Python

    from pydantic import BaseModel, Field

    class Money(BaseModel):
        amount: str = Field(description="The numerical part of the amount.")
        currency: str = Field(description="The currency of amount.")

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="What is the minimum hourly wage in Tokyo right now?",
        config=types.GenerateContentConfig(
                    tools=[
                        types.Tool(
                            file_search=types.FileSearch(
                                file_search_store_names=[file_search_store.name]
                            )
                        )
                    ],
                    responseMimeType="application/json",
                    responseJsonSchema= Money.model_json_schema()
          )
    )
    result = Money.model_validate_json(response.text)
    print(result)

### JavaScript

    import { z } from "zod";
    import { zodToJsonSchema } from "zod-to-json-schema";

    const moneySchema = z.object({
      amount: z.string().describe("The numerical part of the amount."),
      currency: z.string().describe("The currency of amount."),
    });

    async function run() {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "What is the minimum hourly wage in Tokyo right now?",
        config: {
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: [file_search_store.name],
              },
            },
          ],
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(moneySchema),
        },
      });

      const result = moneySchema.parse(JSON.parse(response.text));
      console.log(result);
    }

    run();

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -X POST \
      -d "{
        \"contents\": [{
          \"parts\": [{\"text\": \"What is the minimum hourly wage in Tokyo right now?\"}]
        }],
        \"tools\": [
          {
            \"fileSearch\": {
              \"fileSearchStoreNames\": [\"$STORE_NAME\"]
            }
          }
        ],
        \"generationConfig\": {
            \"responseMimeType\": \"application/json\",
            \"responseJsonSchema\": {
                \"type\": \"object\",
                \"properties\": {
                    \"amount\": {\"type\": \"string\", \"description\": \"The numerical part of the amount.\"},
                    \"currency\": {\"type\": \"string\", \"description\": \"The currency of amount.\"}
                },
                \"required\": [\"amount\", \"currency\"]
            }
        }
      }"

## Supported models

The following models support File Search:

- [`gemini-3-pro-preview`](https://ai.google.dev/gemini-api/docs/models#gemini-3-pro)
- [`gemini-3-flash-preview`](https://ai.google.dev/gemini-api/docs/models#gemini-3-flash)
- [`gemini-2.5-pro`](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-pro)
- [`gemini-2.5-flash-lite`](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-lite)

## Supported file types

File Search supports a wide range of file formats, listed in the following
sections.

### Application file types

- `application/dart`
- `application/ecmascript`
- `application/json`
- `application/ms-java`
- `application/msword`
- `application/pdf`
- `application/sql`
- `application/typescript`
- `application/vnd.curl`
- `application/vnd.dart`
- `application/vnd.ibm.secure-container`
- `application/vnd.jupyter`
- `application/vnd.ms-excel`
- `application/vnd.oasis.opendocument.text`
- `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.template`
- `application/x-csh`
- `application/x-hwp`
- `application/x-hwp-v5`
- `application/x-latex`
- `application/x-php`
- `application/x-powershell`
- `application/x-sh`
- `application/x-shellscript`
- `application/x-tex`
- `application/x-zsh`
- `application/xml`
- `application/zip`

### Text file types

- `text/1d-interleaved-parityfec`
- `text/RED`
- `text/SGML`
- `text/cache-manifest`
- `text/calendar`
- `text/cql`
- `text/cql-extension`
- `text/cql-identifier`
- `text/css`
- `text/csv`
- `text/csv-schema`
- `text/dns`
- `text/encaprtp`
- `text/enriched`
- `text/example`
- `text/fhirpath`
- `text/flexfec`
- `text/fwdred`
- `text/gff3`
- `text/grammar-ref-list`
- `text/hl7v2`
- `text/html`
- `text/javascript`
- `text/jcr-cnd`
- `text/jsx`
- `text/markdown`
- `text/mizar`
- `text/n3`
- `text/parameters`
- `text/parityfec`
- `text/php`
- `text/plain`
- `text/provenance-notation`
- `text/prs.fallenstein.rst`
- `text/prs.lines.tag`
- `text/prs.prop.logic`
- `text/raptorfec`
- `text/rfc822-headers`
- `text/rtf`
- `text/rtp-enc-aescm128`
- `text/rtploopback`
- `text/rtx`
- `text/sgml`
- `text/shaclc`
- `text/shex`
- `text/spdx`
- `text/strings`
- `text/t140`
- `text/tab-separated-values`
- `text/texmacs`
- `text/troff`
- `text/tsv`
- `text/tsx`
- `text/turtle`
- `text/ulpfec`
- `text/uri-list`
- `text/vcard`
- `text/vnd.DMClientScript`
- `text/vnd.IPTC.NITF`
- `text/vnd.IPTC.NewsML`
- `text/vnd.a`
- `text/vnd.abc`
- `text/vnd.ascii-art`
- `text/vnd.curl`
- `text/vnd.debian.copyright`
- `text/vnd.dvb.subtitle`
- `text/vnd.esmertec.theme-descriptor`
- `text/vnd.exchangeable`
- `text/vnd.familysearch.gedcom`
- `text/vnd.ficlab.flt`
- `text/vnd.fly`
- `text/vnd.fmi.flexstor`
- `text/vnd.gml`
- `text/vnd.graphviz`
- `text/vnd.hans`
- `text/vnd.hgl`
- `text/vnd.in3d.3dml`
- `text/vnd.in3d.spot`
- `text/vnd.latex-z`
- `text/vnd.motorola.reflex`
- `text/vnd.ms-mediapackage`
- `text/vnd.net2phone.commcenter.command`
- `text/vnd.radisys.msml-basic-layout`
- `text/vnd.senx.warpscript`
- `text/vnd.sosi`
- `text/vnd.sun.j2me.app-descriptor`
- `text/vnd.trolltech.linguist`
- `text/vnd.wap.si`
- `text/vnd.wap.sl`
- `text/vnd.wap.wml`
- `text/vnd.wap.wmlscript`
- `text/vtt`
- `text/wgsl`
- `text/x-asm`
- `text/x-bibtex`
- `text/x-boo`
- `text/x-c`
- `text/x-c++hdr`
- `text/x-c++src`
- `text/x-cassandra`
- `text/x-chdr`
- `text/x-coffeescript`
- `text/x-component`
- `text/x-csh`
- `text/x-csharp`
- `text/x-csrc`
- `text/x-cuda`
- `text/x-d`
- `text/x-diff`
- `text/x-dsrc`
- `text/x-emacs-lisp`
- `text/x-erlang`
- `text/x-gff3`
- `text/x-go`
- `text/x-haskell`
- `text/x-java`
- `text/x-java-properties`
- `text/x-java-source`
- `text/x-kotlin`
- `text/x-lilypond`
- `text/x-lisp`
- `text/x-literate-haskell`
- `text/x-lua`
- `text/x-moc`
- `text/x-objcsrc`
- `text/x-pascal`
- `text/x-pcs-gcd`
- `text/x-perl`
- `text/x-perl-script`
- `text/x-python`
- `text/x-python-script`
- `text/x-r-markdown`
- `text/x-rsrc`
- `text/x-rst`
- `text/x-ruby-script`
- `text/x-rust`
- `text/x-sass`
- `text/x-scala`
- `text/x-scheme`
- `text/x-script.python`
- `text/x-scss`
- `text/x-setext`
- `text/x-sfv`
- `text/x-sh`
- `text/x-siesta`
- `text/x-sos`
- `text/x-sql`
- `text/x-swift`
- `text/x-tcl`
- `text/x-tex`
- `text/x-vbasic`
- `text/x-vcalendar`
- `text/xml`
- `text/xml-dtd`
- `text/xml-external-parsed-entity`
- `text/yaml`

## Limitations

- **Live API:** File Search is not supported in the [Live API](https://ai.google.dev/gemini-api/docs/live).
- **Tool incompatibility:** File Search cannot be combined with other tools like [Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search), [URL Context](https://ai.google.dev/gemini-api/docs/url-context), etc. at this time.

### Rate limits

The File Search API has the following limits to enforce service stability:

- **Maximum file size / per document limit**: 100 MB
- **Total size of project File Search stores** (based on user tier):
  - **Free**: 1 GB
  - **Tier 1**: 10 GB
  - **Tier 2**: 100 GB
  - **Tier 3**: 1 TB
- **Recommendation**: Limit the size of each File Search store to under 20 GB to ensure optimal retrieval latencies.

| **Note:** The limit on File Search store size is computed on the backend, based on the size of your input plus the embeddings generated and stored with it. This is typically approximately 3 times the size of your input data.

## Pricing

- Developers are charged for embeddings at indexing time based on existing [embeddings pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-embedding) ($0.15 per 1M tokens).
- Storage is free of charge.
- Query time embeddings are free of charge.
- Retrieved document tokens are charged as regular [context tokens](https://ai.google.dev/gemini-api/docs/tokens).

## What's next

- Visit the API reference for [File Search Stores](https://ai.google.dev/api/file-search/file-search-stores) and File Search [Documents](https://ai.google.dev/api/file-search/documents).
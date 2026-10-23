// A tool call as reported by Mastra's onStepFinish (the name and arguments sit in `payload` in recent versions).
type ToolCall = { payload?: { toolName?: string, args?: unknown }, toolName?: string, args?: unknown }

// The tool's short name (no "browser_" prefix) and its arguments, for the progress panel.
export function toolCallInfo(call: ToolCall) {
    const name = call.payload?.toolName ?? call.toolName ?? ''
    return { tool: name.replace(/^browser_/, ''), args: call.payload?.args ?? call.args }
}

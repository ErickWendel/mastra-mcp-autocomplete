// The URL input and the Autocomplete button: while the agents work, the URL can't change and the button becomes Stop.
export function createRunControls(input: HTMLInputElement, button: HTMLButtonElement) {
    return {
        setRunning(running: boolean) {
            input.disabled = running
            button.textContent = running ? '■ Stop' : 'Autocomplete'
            button.classList.toggle('stop', running)
        },
    }
}

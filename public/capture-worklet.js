class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (!input?.[0]) return true
    const left = input[0]
    const right = input[1] ?? left
    const mono = new Float32Array(left.length)
    for (let i = 0; i < left.length; i++) mono[i] = (left[i] + right[i]) / 2
    this.port.postMessage(mono)
    return true
  }
}

registerProcessor('capture-processor', CaptureProcessor)

import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'
import { ReadableStream, TransformStream, WritableStream } from 'stream/web'

const globalScope = globalThis as unknown as Record<string, unknown>

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder
}

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
}

if (!globalThis.BroadcastChannel) {
  class MockBroadcastChannel {
    name: string
    onmessage: ((event: MessageEvent) => void) | null = null

    constructor(name: string) {
      this.name = name
    }

    postMessage(): void {}
    close(): void {}
    addEventListener(): void {}
    removeEventListener(): void {}
  }

  globalScope.BroadcastChannel = MockBroadcastChannel
}

if (!globalThis.ReadableStream) {
  globalScope.ReadableStream = ReadableStream
}

if (!globalThis.WritableStream) {
  globalScope.WritableStream = WritableStream
}

if (!globalThis.TransformStream) {
  globalScope.TransformStream = TransformStream
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('light'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

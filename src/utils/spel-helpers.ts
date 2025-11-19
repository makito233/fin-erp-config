export interface ArrayStream<T = unknown> {
  map(fn: (value: any, index: number) => any): ArrayStream<T>
  filter(fn: (value: any, index: number) => boolean): ArrayStream<T>
  distinct(): ArrayStream<T>
  toArray(): any[]
  count(): number
}

type StreamState = {
  value: any[]
}

function createStream(initial: any[]): ArrayStream {
  const state: StreamState = { value: [...initial] }

  const stream: ArrayStream = {
    map(fn) {
      state.value = state.value.map((item, index) => fn(item, index))
      return stream
    },
    filter(fn) {
      state.value = state.value.filter((item, index) => fn(item, index))
      return stream
    },
    distinct() {
      const seen = new Set<string>()
      state.value = state.value.filter(item => {
        const key = typeof item === 'object' ? JSON.stringify(item) : String(item)
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })
      return stream
    },
    toArray() {
      return [...state.value]
    },
    count() {
      return state.value.length
    }
  }

  return stream
}

let initialized = false

export function ensureSpelHelpers() {
  if (initialized) return
  initialized = true

  if (!(Array.prototype as any).stream) {
    Object.defineProperty(Array.prototype, 'stream', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function stream() {
        if (!Array.isArray(this)) {
          return createStream([])
        }
        return createStream(this.filter((item: unknown) => item !== undefined && item !== null))
      }
    })
  }
}

declare global {
  interface Array<T> {
    stream(): ArrayStream<T>
  }
}

export {}



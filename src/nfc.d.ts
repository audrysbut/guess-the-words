interface NDEFReaderEventMap {
  reading: NDEFReadingEvent
}

interface NDEFReader extends EventTarget {
  scan(): Promise<void>
  write(message: string | NDEFMessageInit, options?: NDEFWriteOptions): Promise<void>
  addEventListener<K extends keyof NDEFReaderEventMap>(type: K, listener: (event: NDEFReaderEventMap[K]) => void): void
  removeEventListener<K extends keyof NDEFReaderEventMap>(type: K, listener: (event: NDEFReaderEventMap[K]) => void): void
}

declare class NDEFReader extends EventTarget {
  constructor()
  scan(): Promise<void>
  write(message: string | NDEFMessageInit, options?: NDEFWriteOptions): Promise<void>
}

interface NDEFReadingEvent extends Event {
  message: NDEFMessage
  serialNumber: string
}

interface NDEFMessage {
  records: NDEFRecord[]
}

interface NDEFRecord {
  recordType: string
  encoding?: string
  data: ArrayBuffer
  lang?: string
  record?: NDEFRecord
}

interface NDEFMessageInit {
  records: NDEFRecordInit[]
}

interface NDEFRecordInit {
  recordType: string
  data: string | BufferSource
  encoding?: string
  lang?: string
}

interface NDEFWriteOptions {
  overwrite?: boolean
}

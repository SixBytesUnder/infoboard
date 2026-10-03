export interface MediaAsset {
  type: 'image' | 'video'
  url: string
  identifier: string
  title?: string
  credit?: string
  folder?: string
}

export interface ExifMetadata {
  Make?: string
  Model?: string
  DateTime?: string
  ExposureTime?: string
  ExposureProgram?: string
  FNumber?: string
  ISO?: string
  Flash?: string
  FocalLength?: string
  PixelXDimension?: string
  PixelYDimension?: string
}

export interface BackgroundBatch {
  items: MediaAsset[]
  currentFolder?: string
  nextFolder?: string
}

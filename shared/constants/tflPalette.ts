export interface TfLColorSpec {
  bg: string
  text: string
}

export const TFL_LINE_COLORS: Record<string, TfLColorSpec> = {
  bakerloo: { bg: '#aa571e', text: '#ffffff' },
  central: { bg: '#d8121b', text: '#ffffff' },
  circle: { bg: '#ffd000', text: '#113892' },
  district: { bg: '#00702f', text: '#ffffff' },
  dlr: { bg: '#00a3a0', text: '#ffffff' },
  'elizabeth-line': { bg: '#704491', text: '#ffffff' },
  elizabeth: { bg: '#704491', text: '#ffffff' },
  'hammersmith-city': { bg: '#eda1b0', text: '#113892' },
  jubilee: { bg: '#81888b', text: '#ffffff' },
  metropolitan: { bg: '#8a134d', text: '#ffffff' },
  northern: { bg: '#000000', text: '#ffffff' },
  piccadilly: { bg: '#112d81', text: '#ffffff' },
  tram: { bg: '#7db41d', text: '#ffffff' },
  victoria: { bg: '#009cd6', text: '#ffffff' },
  'waterloo-city': { bg: '#7ec4ab', text: '#113892' },
  overground: { bg: '#e86a10', text: '#ffffff' },
  // Overground Named Lines
  liberty: { bg: '#656664', text: '#ffffff' },
  lioness: { bg: '#f7a800', text: '#ffffff' },
  mildmay: { bg: '#0076ac', text: '#ffffff' },
  suffragette: { bg: '#65b361', text: '#ffffff' },
  weaver: { bg: '#883960', text: '#ffffff' },
  windrush: { bg: '#e20026', text: '#ffffff' }
}

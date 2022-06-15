interface LoopTypes<T = any> {
  [k: string]: T
}

export type PropertyPick<T, K extends keyof T> = T[K]

type ArrItem = string | LoopTypes<any>
export type ArrDataTypes = ArrItem[]

interface IndexInfoTypes {
  start: number,
  end: number,
  index: number
}
export type DataIndexTypes = IndexInfoTypes[]

export interface MatchTypes {
  [index: number]: string
  groups: any,
  index: number,
  input: string
}

export interface NextMatchInfoTypes {
  line: number,
  start: number,
  end: number,
  str: string,
  input: ArrItem
}

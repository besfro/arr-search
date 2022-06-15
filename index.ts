import { DataIndexTypes, MatchTypes, NextMatchInfoTypes } from './interface'

export interface SearchResultTypes extends Finder {}
export interface ArrSearchTypes extends ArrSearch {}

class Finder {
  // 关键词是否包含分隔符 
  protected isSeparatorKeyword: boolean
  // 所有的匹配结果
  protected _matches: MatchTypes[]
  // 当前为第几条结果
  protected index: number = -1
  // 总匹配量
  protected total: number = 0

  constructor (
    protected arr: DataIndexTypes,
    protected keyword: string,
    protected stringTemp: string,
    protected stringIndex: DataIndexTypes,
    protected separator: string,
    // 是否区分大小写
    protected sensitive: boolean = false
  ) {
    // 搜索的关键词是否包含分隔符
    this.isSeparatorKeyword = keyword.indexOf(separator) !== -1
    this._search(keyword)
  }

  private _search (keyword: string) {
    const reg = new RegExp(this.keyword, 'g' + (!this.sensitive ? 'i' : '') )
    const matches = this._matches = this._invalidFilter(this.stringTemp.matchAll(reg))
    this.index = -1
    this.keyword = keyword
    this.total = matches.length
  }

  private _invalidFilter (generator: IterableIterator<RegExpMatchArray>) {
    if (this.isSeparatorKeyword) {
      const arr = []
      
      let next = generator.next()
      while (!next.done) {
        const item = next.value
        const { 0: matchStr, index } = item
        const start = index
        const end = start + matchStr.length - 1
        const find = this._indexFinder(index)
        find && ( find.start >= start && find.end <= end ) && arr.push(item)
        next = generator.next()
      }

      return arr

    } else {
      return Array.from(generator)
    }
  }

  // 查询下标所在的索引
  private _indexFinder (index: number) {

    let arr = this.stringIndex
    let left = 0, right = arr.length - 1
    
    while (left < right) {
      let last = arr[right]
      let first = arr[left]
      let min = first.start
      let max = last.end                                
      
      let middleLen = left + Math.floor((right - left) / 2)
      let middleItem = arr[middleLen]
      let middle = middleItem.end

      if (index <= middle && index >= min) {
        right = middleLen
      } else if (index > middle && index <= max) {
        left = middleLen + 1
      }
    }

    return arr[left] || null

  }

  next () {
    const matches = this._matches
    const currentIndex = this.index
    const maxIndex = matches.length - 1
    this.index = currentIndex >= maxIndex ? 0 : currentIndex + 1
    const currentInfo = this.getMatchInfo()
    return currentInfo
  }

  prev (): NextMatchInfoTypes {
    const matches = this._matches
    const currentIndex = this.index
    const maxIndex = matches.length - 1
    this.index = currentIndex <= 0 ? maxIndex : currentIndex - 1
    const currentInfo = this.getMatchInfo()
    return currentInfo
  }

  getMatchInfo (index = this.index): NextMatchInfoTypes {
    const match = this._matches[index]
    if (!match) return null
    
    const str = match[0]
    const { index: line, start } = this._indexFinder(match.index)
    const diff = match.index - start
    return {
      line,
      start: diff,
      end: diff + str.length - 1,
      str,
      input: this.arr[line]
    }
  }

  resetIndex () {
    this.index = -1
  }
}

export default class ArrSearch {
  
  protected separator: string
  protected stringTemp: string
  protected stringIndex: DataIndexTypes

  constructor (
    protected arr: DataIndexTypes,
    // 严格查询, 开启将区分大小写
    protected sensitive: boolean = false,
    // 数据为二维数组时, 检索数组元素指定字段
    protected searchKey: string | null = null 
  ) {
    const start = performance.now()
    
    this.arr = arr
    this.separator = '#'
    this.createIndex()
    console.group('initial')
    console.log('duration: ', performance.now() - start + 'ms')
    console.log('array length:', arr.length)
    console.groupEnd()
  }

  private createIndex () {
    const stringIndex: DataIndexTypes = []
    const skip = 1 + this.separator.length
    const searchKey = this.searchKey
    const arr = this.arr

    let currentIndex = 0
    let i = 0, len = arr.length
    // 设置了 searchKey 程序将将检索数组元素的属性
    // e.g. [{ message: 'this is message' }]
    let stringTemp = !searchKey ? arr.join(this.separator) : ''
    
    while (i < len) {
      const item = arr[i]
      
      let str = item
      if (searchKey && Object.prototype.hasOwnProperty.call(str, searchKey)) {
        str = item[searchKey] 
        stringTemp += `${i > 0 ? this.separator : ''}${str}`
      }

      const len = `${str}`.length
      const start = currentIndex + ( i > 0 ? skip : 0 )
      const end = start + len - 1

      currentIndex = end
      stringIndex.push({
        start,
        end,
        index: i++
      })
    }
    
    this.stringTemp = stringTemp
    this.stringIndex = stringIndex
  }

  search (keyword: string): SearchResultTypes {
    return new Finder(
      this.arr,
      keyword,
      this.stringTemp,
      this.stringIndex,
      this.separator
    )
  }
}

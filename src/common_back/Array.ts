

export function initArray_BySameValue(length_: number, value: any) {
    return Array.from({length: length_}, () => {return value} )
}

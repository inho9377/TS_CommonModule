
export function getNumberByString(value: string): Number {
    return Number(value)
}

export function getEnumByString<T>(value: string): T {
    return value as unknown as T
}

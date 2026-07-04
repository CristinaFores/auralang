import { collapseRepeats } from './text'

describe('collapseRepeats', () => {
  it('collapses a stutter run of 3+ identical words to one', () => {
    expect(collapseRepeats('tu tu tu tu')).toBe('tu')
    expect(collapseRepeats('gracias por venir tu tu tu')).toBe('gracias por venir tu')
  })

  it('leaves legitimate doubles untouched', () => {
    expect(collapseRepeats('no no puede ser')).toBe('no no puede ser')
    expect(collapseRepeats('muy muy bien')).toBe('muy muy bien')
  })

  it('ignores case and punctuation when matching', () => {
    expect(collapseRepeats('Tu, tu. TU tu')).toBe('Tu,')
  })

  it('collapses only the repeated run, keeping the rest intact', () => {
    expect(collapseRepeats('hola hola hola mundo adiós')).toBe('hola mundo adiós')
  })

  it('returns normal text unchanged', () => {
    expect(collapseRepeats('el código no es perfecto')).toBe('el código no es perfecto')
    expect(collapseRepeats('')).toBe('')
  })
})

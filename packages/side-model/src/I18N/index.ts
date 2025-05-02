import { ArgTypes } from '../ArgTypes'
import Commands from '../Commands'
import { CommandFieldDescriptions as DefaultCommandFieldDescriptions } from './en/CommandFieldDescriptions'

type I18NModelDataShape = {
  ArgTypes: ArgTypes
  Commands: typeof Commands
  CommandFieldDescriptions: typeof DefaultCommandFieldDescriptions
}

const supportedLanguages = ['en', 'zh'] as const

type SupportedLanguages = typeof supportedLanguages[number]

const loadI18NData = async (
  languageCode: SupportedLanguages
): Promise<I18NModelDataShape> => {
  const languageSubstring = languageCode.slice(0, 2)
  if (!supportedLanguages.includes(languageSubstring as SupportedLanguages)) {
    console.error(`Unsupported language code: ${languageCode}`)
    console.warn('Falling back to english for now')
    return await loadI18NData('en')
  }

  try {
    const [ArgTypes, Commands, CommandFieldDescriptions] = await Promise.all([
      import(`./${languageCode}/ArgTypes`),
      import(`./${languageCode}/Commands`),
      import(`./${languageCode}/CommandFieldDescriptions`).catch(() => {
        console.warn(`No CommandFieldDescriptions found for language ${languageCode}, using English as fallback`)
        return import(`./en/CommandFieldDescriptions`)
      }),
    ])

    return {
      ArgTypes: ArgTypes.default,
      Commands: Commands.default,
      CommandFieldDescriptions: CommandFieldDescriptions.default,
    }
  } catch (e) {
    console.error(`Error loading I18N data for ${languageCode}`, e)
    return {
      ArgTypes: (await import(`./en/ArgTypes`)).default,
      Commands: (await import(`./en/Commands`)).default,
      CommandFieldDescriptions: (await import(`./en/CommandFieldDescriptions`)).default,
    }
  }
}

export default loadI18NData

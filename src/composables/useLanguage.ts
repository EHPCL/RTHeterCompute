import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

export function useLanguage() {
  const { locale, t } = useI18n()
  const languages = ref([
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ])

  const changeLanguage = (languageCode: string) => {
    locale.value = languageCode
  }

  const currentLanguage = () => {
    return locale.value
  }

  return {
    t,
    locale,
    languages,
    changeLanguage,
    currentLanguage
  }
}
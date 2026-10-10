import { ref } from 'vue'

export function useInput(defaultValue = '') {
  const value = ref(defaultValue)

  const onChange = (eventOrValue) => {
    value.value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue
  }

  const reset = () => {
    value.value = defaultValue
  }

  return [value, onChange, reset]
}
import { showErrorDialog, showSuccessDialog } from './toolsHelper'

export const notifyResponse = (response, successMessage) => {
  if (response.status === 'success') {
    showSuccessDialog(successMessage)
    return true
  }
  showErrorDialog(response.message)
  return false
}
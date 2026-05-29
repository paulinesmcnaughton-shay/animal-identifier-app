import { Modal } from 'react-native'

import { PrivacyTermsScreenContent } from '@/screens/profile/settings/privacy-terms-screen'

interface PrivacyTermsModalProps {
  visible: boolean
  onClose: () => void
}

export function PrivacyTermsModal({ visible, onClose }: PrivacyTermsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <PrivacyTermsScreenContent onClose={onClose} />
    </Modal>
  )
}

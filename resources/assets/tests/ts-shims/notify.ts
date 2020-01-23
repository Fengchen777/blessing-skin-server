import { ModalOptions, ModalResult } from '../../src/components/Modal'
import { Toast } from '../../src/scripts/toast'

export const showModal = {} as jest.Mock<Promise<ModalResult>, [ModalOptions | void]>
export const toast = {} as Toast

import { ReactNode } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button
} from '@chakra-ui/react';

type FormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: () => void | Promise<void>;
};

export const FormModal = ({
  isOpen,
  onClose,
  title,
  children,
  isSubmitting = false,
  submitLabel = 'Save',
  onSubmit
}: FormModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <ModalBody>{children}</ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="brand" type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  </Modal>
);

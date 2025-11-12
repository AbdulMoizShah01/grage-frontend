import { ReactNode } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  useBreakpointValue,
  useColorModeValue,
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Flex,
  ModalProps,
  ButtonProps
} from '@chakra-ui/react';
import { MdWarning, MdError, MdInfo, MdCheckCircle } from 'react-icons/md';

type ModalTone = 'default' | 'danger' | 'success' | 'info' | 'warning';

type FormModalProps = Omit<ModalProps, 'children' | 'variant'> & {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: () => void | Promise<void>;
  isDisabled?: boolean;
  variant?: ModalTone;
  icon?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
  showCancelButton?: boolean;
  submitButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  hideFooter?: boolean;
  headerAction?: ReactNode;
  isLoading?: boolean;
};

export const FormModal = ({
  isOpen,
  onClose,
  title,
  children,
  isSubmitting = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onSubmit,
  isDisabled = false,
  variant = 'default',
  icon,
  size = 'lg',
  showCancelButton = true,
  submitButtonProps,
  cancelButtonProps,
  hideFooter = false,
  headerAction,
  isLoading = false,
  ...modalProps
}: FormModalProps) => {
  // Responsive values
  const modalSize = useBreakpointValue(
    typeof size === 'string' 
      ? { base: '90%', sm: size } 
      : size
  ) || size;

  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const paddingSize = useBreakpointValue({ base: 4, md: 6 });

  // Theme colors
  const overlayBg = useColorModeValue('blackAlpha.600', 'blackAlpha.800');
  const contentBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const dangerColor = useColorModeValue('red.600', 'red.400');
  const successColor = useColorModeValue('green.600', 'green.400');
  const infoColor = useColorModeValue('blue.600', 'blue.400');
  const warningColor = useColorModeValue('orange.600', 'orange.400');

  // Variant configurations
  const variantConfig: Record<ModalTone, { color: string; icon: any; buttonColorScheme: string }> = {
    default: {
      color: 'brand.500',
      icon: null,
      buttonColorScheme: 'brand'
    },
    danger: {
      color: dangerColor,
      icon: MdError,
      buttonColorScheme: 'red'
    },
    success: {
      color: successColor,
      icon: MdCheckCircle,
      buttonColorScheme: 'green'
    },
    info: {
      color: infoColor,
      icon: MdInfo,
      buttonColorScheme: 'blue'
    },
    warning: {
      color: warningColor,
      icon: MdWarning,
      buttonColorScheme: 'orange'
    }
  };

  const { color, icon: variantIcon, buttonColorScheme } = variantConfig[variant];
  const displayIcon = icon || variantIcon;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onSubmit();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      isCentered
      closeOnOverlayClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
      blockScrollOnMount={true}
      scrollBehavior="inside"
      {...modalProps}
    >
      <ModalOverlay bg={overlayBg} backdropFilter="blur(2px)" />
      <ModalContent 
        bg={contentBg} 
        border="1px" 
        borderColor={borderColor}
        boxShadow="xl"
        borderRadius="xl"
        mx={{ base: 2, sm: 0 }}
      >
        {/* Custom header with icon and action */}
        <ModalHeader 
          pb={3} 
          position="relative"
          pr={headerAction ? 16 : 12}
        >
          <HStack spacing={3} align="flex-start">
            {displayIcon && (
              <Icon 
                as={displayIcon} 
                color={color} 
                boxSize={5} 
                mt={0.5} 
                flexShrink={0}
              />
            )}
            <VStack align="flex-start" spacing={1} flex={1}>
              <Text 
                fontSize={{ base: 'lg', md: 'xl' }} 
                fontWeight="semibold"
                noOfLines={2}
              >
                {title}
              </Text>
            </VStack>
          </HStack>

          {/* Header action button */}
          {headerAction && (
            <Box position="absolute" top={4} right={12}>
              {headerAction}
            </Box>
          )}

          <ModalCloseButton 
            position="absolute"
            right={3}
            top={3}
            size="sm"
            isDisabled={isSubmitting}
          />
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody 
            px={paddingSize} 
            py={0}
            maxH="70vh"
            overflowY="auto"
          >
            <Box pb={hideFooter ? 0 : 4}>
              {children}
            </Box>
          </ModalBody>

          {!hideFooter && (
            <ModalFooter 
              pt={4} 
              pb={paddingSize}
              px={paddingSize}
              bg={useColorModeValue('gray.50', 'gray.900')}
              borderBottomRadius="xl"
            >
              <Flex 
                width="full" 
                direction={{ base: 'column', sm: 'row' }} 
                gap={3}
                justify="space-between"
                align={{ base: 'stretch', sm: 'center' }}
              >
                {/* Left-aligned content (for additional actions) */}
                <Box>
                  {/* Additional footer content can go here */}
                </Box>

                {/* Right-aligned buttons */}
                <HStack 
                  spacing={3} 
                  width={{ base: 'full', sm: 'auto' }}
                  justify={{ base: 'stretch', sm: 'flex-end' }}
                >
                  {showCancelButton && (
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      isDisabled={isSubmitting}
                      size={buttonSize}
                      width={{ base: 'full', sm: 'auto' }}
                      {...cancelButtonProps}
                    >
                      {cancelLabel}
                    </Button>
                  )}
                  <Button
                    colorScheme={buttonColorScheme}
                    type="submit"
                    isLoading={isSubmitting || isLoading}
                    isDisabled={isDisabled}
                    size={buttonSize}
                    width={{ base: 'full', sm: 'auto' }}
                    loadingText={submitLabel}
                    {...submitButtonProps}
                  >
                    {submitLabel}
                  </Button>
                </HStack>
              </Flex>
            </ModalFooter>
          )}
        </form>
      </ModalContent>
    </Modal>
  );
};

// Pre-styled variants for common use cases
export const DangerModal = (props: FormModalProps) => (
  <FormModal variant="danger" submitButtonProps={{ colorScheme: 'red' }} {...props} />
);

export const SuccessModal = (props: FormModalProps) => (
  <FormModal variant="success" submitButtonProps={{ colorScheme: 'green' }} {...props} />
);

export const InfoModal = (props: FormModalProps) => (
  <FormModal variant="info" submitButtonProps={{ colorScheme: 'blue' }} {...props} />
);

export const WarningModal = (props: FormModalProps) => (
  <FormModal variant="warning" submitButtonProps={{ colorScheme: 'orange' }} {...props} />
);

// Compact modal for simple confirmations
export const ConfirmModal = ({ 
  message, 
  ...props 
}: FormModalProps & { message: string }) => (
  <FormModal
    size="sm"
    hideFooter={false}
    {...props}
  >
    <Text>{message}</Text>
  </FormModal>
);

// Full-screen modal for complex forms
export const FullScreenFormModal = (props: FormModalProps) => (
  <FormModal
    size="full"
    scrollBehavior="inside"
    {...props}
  />
);
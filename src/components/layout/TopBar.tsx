import { ReactNode } from 'react';
import { Flex, Heading, Spacer, HStack, IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';

type TopBarProps = {
  title: string;
  actions?: ReactNode;
};

export const TopBar = ({ title, actions }: TopBarProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const background = useColorModeValue('surface.base', '#111111');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const headingColor = useColorModeValue('text.primary', 'gray.100');
  const iconColor = useColorModeValue('gray.600', 'gray.200');

  return (
    <Flex
      align="center"
      px={6}
      py={4}
      borderBottomWidth="1px"
      borderColor={borderColor}
      bg={background}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Heading size="md" color={headingColor}>
        {title}
      </Heading>
      <Spacer />
      <HStack spacing={3}>
        {actions}
        <IconButton
          aria-label="Toggle color mode"
          variant="ghost"
          icon={colorMode === 'light' ? <MdDarkMode /> : <MdLightMode />}
          onClick={toggleColorMode}
          color={iconColor}
        />
      </HStack>
    </Flex>
  );
};

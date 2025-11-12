import { ReactNode } from 'react';
import { 
  Flex, 
  Heading, 
  Spacer, 
  HStack, 
  IconButton, 
  useColorMode, 
  useColorModeValue,
  Box,
  useBreakpointValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text
} from '@chakra-ui/react';
import { MdLightMode, MdDarkMode, MdMenu, MdNotifications } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { useMobileMenu } from './MobileMenuContext';

type TopBarProps = {
  title: string;
  actions?: ReactNode;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  notificationCount?: number;
};

export const TopBar = ({ 
  title, 
  actions, 
  showMobileMenu: showMobileMenuProp,
  onMobileMenuToggle: onMobileMenuToggleProp,
  breadcrumbs,
  notificationCount 
}: TopBarProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  
  // Get mobile menu from context, fallback to props
  const mobileMenuContext = useMobileMenu();
  const showMobileMenu = showMobileMenuProp ?? mobileMenuContext?.isOpen ?? false;
  const onMobileMenuToggle = onMobileMenuToggleProp ?? mobileMenuContext?.onOpen;
  
  // Responsive values
  const headingSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const paddingX = useBreakpointValue({ base: 4, md: 6 });
  const showMobileMenuButton = useBreakpointValue({ base: true, md: false });
  
  // Theme colors
  const background = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const iconColor = useColorModeValue('gray.600', 'gray.200');
  const breadcrumbColor = useColorModeValue('gray.600', 'gray.400');
  const mobileMenuButtonColor = useColorModeValue('gray.600', 'gray.200');

  return (
    <Flex
      align="center"
      px={paddingX}
      py={4}
      borderBottomWidth="1px"
      borderColor={borderColor}
      bg={background}
      position="sticky"
      top={0}
      zIndex={10}
      minH="76px"
      gap={4}
    >
      {/* Mobile Menu Button */}
      {showMobileMenuButton && onMobileMenuToggle && (
        <IconButton
          aria-label="Toggle menu"
          variant="ghost"
          icon={<MdMenu />}
          onClick={onMobileMenuToggle}
          color={mobileMenuButtonColor}
          size="sm"
        />
      )}

      {/* Title and Breadcrumbs Section */}
      <Box flex={{ base: 1, md: 'auto' }} minW={0}>
        {/* Breadcrumbs - Desktop only */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb 
            spacing={2} 
            mb={1}
            display={{ base: 'none', md: 'flex' }}
            color={breadcrumbColor}
            fontSize="sm"
          >
            {breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
                {crumb.to ? (
                  <BreadcrumbLink as={RouterLink} to={crumb.to}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <Text>{crumb.label}</Text>
                )}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        )}

        {/* Title */}
        <Heading 
          size={headingSize} 
          color={headingColor}
          noOfLines={1}
          fontWeight="semibold"
        >
          {title}
        </Heading>

        {/* Mobile Breadcrumbs - Simplified */}
        {breadcrumbs && breadcrumbs.length > 1 && (
          <Text 
            fontSize="xs" 
            color={breadcrumbColor}
            display={{ base: 'block', md: 'none' }}
            noOfLines={1}
            mt={1}
          >
            {breadcrumbs[breadcrumbs.length - 2]?.label} › {title}
          </Text>
        )}
      </Box>

      <Spacer />

      {/* Actions Section */}
      <HStack spacing={2}>
        {actions && (
          <Box display={{ base: 'none', sm: 'block' }}>
            {actions}
          </Box>
        )}

     

        {/* Theme Toggle */}
        <IconButton
          aria-label="Toggle color mode"
          variant="ghost"
          icon={colorMode === 'light' ? <MdDarkMode /> : <MdLightMode />}
          onClick={toggleColorMode}
          color={iconColor}
          size="sm"
        />
      </HStack>
    </Flex>
  );
};

// Additional compact variant for nested pages
export const CompactTopBar = (props: TopBarProps) => {
  return (
    <TopBar
      {...props}
      breadcrumbs={undefined}
    />
  );
};
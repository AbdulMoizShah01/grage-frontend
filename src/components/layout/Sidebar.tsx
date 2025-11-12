import { ReactNode, useState } from 'react';
import { Box, Flex, Icon, Text, VStack, Link as ChakraLink, Badge, useColorModeValue, Image, useBreakpointValue } from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdAssignment,
  MdInventory,
  MdEngineering,
  MdHistory,
  MdHomeRepairService,
  MdInsights,
  MdOutlineViewModule,
  MdMenu,
  MdClose
} from 'react-icons/md';

type NavItem = {
  label: string;
  to: string;
  icon: typeof MdDashboard;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: MdDashboard },
  { label: 'Metadata', to: '/metadata', icon: MdOutlineViewModule },
  { label: 'Work Orders', to: '/work-orders', icon: MdAssignment },
  { label: 'Work Order History', to: '/work-orders/history', icon: MdHistory },
  { label: 'Inventory', to: '/inventory', icon: MdInventory },
  { label: 'Services', to: '/services', icon: MdHomeRepairService },
  { label: 'Workers', to: '/workers', icon: MdEngineering },
  { label: 'Insights', to: '/insights', icon: MdInsights }
];

type SidebarProps = {
  footer?: ReactNode;
  inventoryAlertsCount?: number;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
};

export const Sidebar = ({ 
  footer, 
  inventoryAlertsCount, 
  isMobileOpen = false,
  onMobileToggle 
}: SidebarProps) => {
  const location = useLocation();
  
  // Responsive values
  const sidebarWidth = useBreakpointValue({ base: '100%', md: 64 });
  const sidebarPosition = useBreakpointValue<'fixed' | 'sticky'>({ base: 'fixed', md: 'sticky' });
  const sidebarZIndex = useBreakpointValue({ base: 1000, md: 'auto' });
  const showMobileMenu = useBreakpointValue({ base: true, md: false });
  
  // Theme colors
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mobileOverlayBg = useColorModeValue('blackAlpha.600', 'blackAlpha.800');

  // Mobile sidebar styles
  const mobileTransform = isMobileOpen ? 'translateX(0)' : 'translateX(-100%)';
  const mobileTransition = 'transform 0.3s ease-in-out';

  return (
    <>
      {/* Mobile Overlay */}
      {showMobileMenu && isMobileOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={mobileOverlayBg}
          zIndex={999}
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <Box
        as="nav"
        bg={sidebarBg}
        borderRightWidth="1px"
        borderColor={borderColor}
        w={sidebarWidth}
        minH={{ base: '100vh', md: '100vh' }}
        h={{ base: '100vh', md: 'auto' }}
        py={6}
        px={4}
        position={sidebarPosition}
        top={0}
        left={0}
        zIndex={sidebarZIndex}
        transform={{ base: mobileTransform, md: 'none' }}
        transition={{ base: mobileTransition, md: 'none' }}
        boxShadow={{ base: 'lg', md: 'none' }}
      >
        {/* Mobile Header */}
        {showMobileMenu && (
          <Flex justify="space-between" align="center" mb={6} display={{ base: 'flex', md: 'none' }}>
            <Image src="/full-logo.png" alt="Garage branding" maxH="32px" />
            <Icon
              as={isMobileOpen ? MdClose : MdMenu}
              boxSize={6}
              onClick={onMobileToggle}
              cursor="pointer"
              color={textColor}
            />
          </Flex>
        )}

        {/* Desktop Logo */}
        <Flex 
          align="center" 
          mb={8} 
          display={{ base: 'none', md: 'flex' }}
        >
          <Image src="/full-logo.png" alt="Garage branding" maxH="40px" />
        </Flex>

        {/* Navigation Items */}
        <VStack align="stretch" spacing={1} color={textColor}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const showInventoryBadge = item.to === '/inventory' && (inventoryAlertsCount ?? 0) > 0;

            return (
              <ChakraLink
                key={item.to}
                as={NavLink}
                to={item.to}
                borderRadius="md"
                _hover={{ 
                  textDecoration: 'none', 
                  bg: hoverBg,
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s'
                }}
                _activeLink={{ 
                  bg: activeBg, 
                  color: activeColor, 
                  fontWeight: 'semibold',
                  borderLeft: '4px solid',
                  borderLeftColor: activeColor,
                  pl: 2
                }}
                px={3}
                py={3}
                onClick={() => {
                  if (showMobileMenu) {
                    onMobileToggle?.();
                  }
                }}
                position="relative"
                transition="all 0.2s"
              >
                <Flex align="center" gap={3}>
                  <Icon 
                    as={item.icon} 
                    boxSize={5} 
                    color={isActive ? activeColor : textColor}
                  />
                  <Text 
                    flex="1" 
                    fontSize="sm"
                    fontWeight={isActive ? 'semibold' : 'normal'}
                  >
                    {item.label}
                  </Text>
                  {showInventoryBadge ? (
                    <Badge 
                      colorScheme="red" 
                      borderRadius="full"
                      minW="6"
                      h="6"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {inventoryAlertsCount}
                    </Badge>
                  ) : null}
                </Flex>
              </ChakraLink>
            );
          })}
        </VStack>

        {/* Footer */}
        {footer ? (
          <Flex 
            mt="auto" 
            pt={8}
            display={{ base: 'none', md: 'flex' }}
          >
            {footer}
          </Flex>
        ) : null}
      </Box>
    </>
  );
};

// Mobile toggle hook for convenience
export const useSidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const onToggle = () => setIsMobileOpen(!isMobileOpen);
  const onClose = () => setIsMobileOpen(false);
  const onOpen = () => setIsMobileOpen(true);
  
  return {
    isMobileOpen,
    onToggle,
    onClose,
    onOpen
  };
};
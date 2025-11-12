import { ReactNode, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  useColorModeValue, 
  useBreakpointValue,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody
} from '@chakra-ui/react';

import { Sidebar } from './Sidebar';
import { MobileMenuProvider } from './MobileMenuContext';
import { useDashboardSummary } from '../../hooks/useDashboardSummary';

type PersistentLayoutProps = {
  children?: ReactNode;
};

export const PersistentLayout = ({ children }: PersistentLayoutProps) => {
  const { data: summary } = useDashboardSummary();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Responsive values
  const showMobileSidebar = useBreakpointValue({ base: true, md: false });
  
  // Theme colors
  const appBackground = useColorModeValue('gray.50', 'gray.900');
  const mobileDrawerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    if (!showMobileSidebar && isOpen) {
      onClose();
    }
  }, [showMobileSidebar, isOpen, onClose]);

  // Mobile sidebar component
  const MobileSidebar = () => (
    <Drawer
      isOpen={isOpen}
      placement="left"
      onClose={onClose}
      size="full"
    >
      <DrawerOverlay />
      <DrawerContent bg={mobileDrawerBg}>
        <DrawerCloseButton 
          size="lg" 
          top={4} 
          right={4}
          color="currentColor"
        />
        <DrawerBody p={0}>
          <Sidebar 
            inventoryAlertsCount={summary?.inventoryAlertsCount}
            isMobileOpen={isOpen}
            onMobileToggle={onClose}
            footer={
              <Box p={4} borderTop="1px" borderColor={borderColor}>
                {/* Mobile footer content can go here */}
              </Box>
            }
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  return (
    <MobileMenuProvider value={{ isOpen, onOpen, onClose }}>
      <Flex 
        minH="100vh" 
        bg={appBackground} 
        color="text.primary" 
        position="relative"
      >
        {/* Desktop Sidebar - Persists across all routes, never re-renders */}
        <Box
          display={{ base: 'none', md: 'block' }}
          position="sticky"
          top={0}
          h="100vh"
          flexShrink={0}
          zIndex={10}
        >
          <Sidebar 
            inventoryAlertsCount={summary?.inventoryAlertsCount}
          />
        </Box>

        {/* Mobile Sidebar Drawer */}
        {showMobileSidebar && <MobileSidebar />}

        {/* Main Content Area - Only this changes on route navigation */}
        <Box 
          flex="1" 
          display="flex" 
          flexDirection="column"
          minW={0}
          position="relative"
          zIndex={0}
        >
          {children || <Outlet />}
        </Box>
      </Flex>
    </MobileMenuProvider>
  );
};


import { ReactNode } from 'react';
import { Box, Flex, Icon, Text, VStack, Link as ChakraLink, Badge, useColorModeValue, Image } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import {
  MdDashboard,
  MdAssignment,
  MdInventory,
  MdEngineering,
  MdHistory,
  MdHomeRepairService,
  MdInsights,
  MdOutlineViewModule,
  MdPayments
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
  { label: 'Spendings', to: '/spendings', icon: MdPayments },
  { label: 'Insights', to: '/insights', icon: MdInsights }
];

type SidebarProps = {
  footer?: ReactNode;
  inventoryAlertsCount?: number;
};

export const Sidebar = ({ footer, inventoryAlertsCount }: SidebarProps) => {
  const sidebarBg = useColorModeValue('surface.base', '#111111');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const activeBg = useColorModeValue('brand.50', 'whiteAlpha.200');
  const activeColor = useColorModeValue('brand.600', 'white');
  const textColor = useColorModeValue('text.primary', 'gray.100');

  return (
    <Box
      as="nav"
      bg={sidebarBg}
      borderRightWidth="1px"
      borderColor={borderColor}
      w={{ base: 'full', md: 64 }}
      minH="100vh"
      py={6}
      px={4}
      position="sticky"
      top={0}
    >
      <Flex align="center" mb={8}>
        <Image src="/full-logo.png" alt="Garage branding" maxH="40px" />
      </Flex>
      <VStack align="stretch" spacing={1} color={textColor}>
        {navItems.map((item) => {
          const showInventoryBadge = item.to === '/inventory' && (inventoryAlertsCount ?? 0) > 0;

          return (
            <ChakraLink
              key={item.to}
              as={NavLink}
              to={item.to}
              borderRadius="md"
              _hover={{ textDecoration: 'none', bg: hoverBg }}
              _activeLink={{ bg: activeBg, color: activeColor, fontWeight: 'semibold' }}
              px={3}
              py={2}
            >
              <Flex align="center" gap={3}>
                <Icon as={item.icon} boxSize={5} />
                <Text flex="1">{item.label}</Text>
                {showInventoryBadge ? (
                  <Badge colorScheme="red" borderRadius="full">
                    {inventoryAlertsCount}
                  </Badge>
                ) : null}
              </Flex>
            </ChakraLink>
          );
        })}
      </VStack>
      {footer ? (
        <Flex mt="auto" pt={8}>
          {footer}
        </Flex>
      ) : null}
    </Box>
  );
};

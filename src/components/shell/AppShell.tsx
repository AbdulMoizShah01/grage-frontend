import { ReactNode } from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';

import { Sidebar } from '../layout/Sidebar';
import { TopBar } from '../layout/TopBar';

type AppShellProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  inventoryAlertsCount?: number;
};

export const AppShell = ({ title, children, actions, inventoryAlertsCount }: AppShellProps) => {
  const appBackground = useColorModeValue('surface.muted', 'surface.muted');
  const mainBackground = useColorModeValue('surface.muted', '#060606');

  return (
    <Flex minH="100vh" bg={appBackground} color="text.primary" transition="background-color 0.2s ease">
      <Sidebar inventoryAlertsCount={inventoryAlertsCount} />
      <Box flex="1" display="flex" flexDirection="column">
        <TopBar title={title} actions={actions} />
        <Box as="main" px={6} py={6} flex="1" bg={mainBackground}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
};

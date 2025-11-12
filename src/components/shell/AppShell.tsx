import { ReactNode } from 'react';
import { 
  Box, 
  useColorModeValue, 
  useBreakpointValue,
  BoxProps
} from '@chakra-ui/react';

import { TopBar } from '../layout/TopBar';

type AppShellProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  inventoryAlertsCount?: number;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  maxWidth?: string;
  fullWidth?: boolean;
  containerProps?: BoxProps;
  mainPadding?: any;
};

export const AppShell = ({ 
  title, 
  children, 
  actions, 
  inventoryAlertsCount, 
  breadcrumbs,
  maxWidth = '100%',
  fullWidth = false,
  containerProps,
  mainPadding: mainPaddingProp
}: AppShellProps) => {
  // Responsive values
  const mainPadding = mainPaddingProp ?? useBreakpointValue({ base: 4, md: 6, lg: 8 });
  
  // Theme colors
  const mainBackground = useColorModeValue('white', 'gray.800');

  return (
    <>
      <TopBar 
        title={title} 
        actions={actions}
        breadcrumbs={breadcrumbs}
        notificationCount={inventoryAlertsCount}
      />
      
      <Box 
        as="main" 
        flex="1"
        px={mainPadding}
        py={mainPadding}
        bg={mainBackground}
        position="relative"
        zIndex={0}
        overflow="hidden"
        {...containerProps}
      >
        {/* Content Container with optional max width */}
        <Box
          maxW={fullWidth ? '100%' : maxWidth}
          mx={fullWidth ? 0 : 'auto'}
          w="100%"
          h="100%"
          position="relative"
        >
          {children}
        </Box>
      </Box>
    </>
  );
};

// Variant for full-width layouts (like dashboards)
export const DashboardShell = (props: AppShellProps) => (
  <AppShell 
    fullWidth={true}
    maxWidth="100%"
    containerProps={{
      px: 0,
      py: 0
    }}
    {...props} 
  />
);

// Variant for form-heavy pages with centered content
export const FormShell = (props: AppShellProps) => (
  <AppShell 
    maxWidth="4xl"
    containerProps={{
      display: 'flex',
      flexDirection: 'column'
    }}
    {...props} 
  />
);

// Variant for reading/content pages
export const ContentShell = (props: AppShellProps) => (
  <AppShell 
    maxWidth="6xl"
    containerProps={{
      display: 'flex',
      flexDirection: 'column'
    }}
    {...props} 
  />
);

// Compact variant for settings and nested pages
export const CompactShell = (props: AppShellProps) => (
  <AppShell 
    maxWidth="6xl"
    mainPadding={{ base: 4, md: 6 }}
    {...props} 
  />
);
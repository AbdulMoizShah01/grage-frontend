import { ReactNode } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Icon, 
  HStack, 
  VStack, 
  useColorModeValue,
  useBreakpointValue,
  Tooltip,
  Badge,
  BoxProps
} from '@chakra-ui/react';
import { IconType } from 'react-icons';

type StatCardProps = BoxProps & {
  label: string;
  value: ReactNode;
  helperText?: string;
  icon?: IconType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  colorScheme?: 'green' | 'red' | 'blue' | 'orange' | 'purple' | 'gray' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isCurrency?: boolean;
  onClick?: () => void;
};

export const StatCard = ({ 
  label, 
  value, 
  helperText, 
  icon,
  trend,
  trendValue,
  colorScheme = 'brand',
  size = 'md',
  isLoading = false,
  isCurrency = false,
  onClick,
  ...rest 
}: StatCardProps) => {
  // Responsive values
  const headingSize = useBreakpointValue({
    base: size === 'lg' ? 'lg' : 'md',
    md: size === 'lg' ? 'xl' : size === 'sm' ? 'md' : 'lg'
  });

  const paddingSize = useBreakpointValue({
    base: size === 'lg' ? 4 : 3,
    md: size === 'lg' ? 6 : size === 'sm' ? 4 : 5
  });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const valueColor = useColorModeValue('gray.900', 'white');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Trend colors
  const trendUpColor = useColorModeValue('green.600', 'green.300');
  const trendDownColor = useColorModeValue('red.600', 'red.300');
  const trendNeutralColor = useColorModeValue('gray.500', 'gray.400');

  // Color scheme mappings
  const colorSchemes = {
    green: { color: useColorModeValue('green.600', 'green.300'), bg: useColorModeValue('green.50', 'green.900') },
    red: { color: useColorModeValue('red.600', 'red.300'), bg: useColorModeValue('red.50', 'red.900') },
    blue: { color: useColorModeValue('blue.600', 'blue.300'), bg: useColorModeValue('blue.50', 'blue.900') },
    orange: { color: useColorModeValue('orange.600', 'orange.300'), bg: useColorModeValue('orange.50', 'orange.900') },
    purple: { color: useColorModeValue('purple.600', 'purple.300'), bg: useColorModeValue('purple.50', 'purple.900') },
    gray: { color: useColorModeValue('gray.600', 'gray.300'), bg: useColorModeValue('gray.50', 'gray.700') },
    brand: { color: useColorModeValue('brand.600', 'brand.300'), bg: useColorModeValue('brand.50', 'brand.900') }
  };

  const trendConfig = {
    up: { 
      color: trendUpColor, 
      icon: '↗' 
    },
    down: { 
      color: trendDownColor, 
      icon: '↘' 
    },
    neutral: { 
      color: trendNeutralColor, 
      icon: '→' 
    }
  };

  const currentTrend = trend ? trendConfig[trend] : null;
  const currentColorScheme = colorSchemes[colorScheme];

  // Sizing configurations
  const sizeConfig = {
    sm: {
      iconSize: 4,
      labelSize: 'xs',
      helperSize: 'xs',
      spacing: 1
    },
    md: {
      iconSize: 5,
      labelSize: 'sm',
      helperSize: 'sm',
      spacing: 2
    },
    lg: {
      iconSize: 6,
      labelSize: 'md',
      helperSize: 'sm',
      spacing: 3
    }
  };

  const { iconSize, labelSize, helperSize, spacing } = sizeConfig[size];

  return (
    <Tooltip label={helperText} hasArrow placement="top" isDisabled={!helperText || Boolean(onClick)}>
      <Box
        bg={cardBg}
        borderRadius="xl"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        p={paddingSize}
        transition="all 0.2s"
        _hover={onClick ? { 
          bg: hoverBg, 
          transform: 'translateY(-2px)',
          boxShadow: 'md',
          cursor: 'pointer'
        } : {}}
        position="relative"
        overflow="hidden"
        onClick={onClick}
        {...rest}
      >
        {/* Color accent bar */}
        <Box
          position="absolute"
          top={0}
          left={0}
          w="4px"
          h="full"
          bg={currentColorScheme.color}
        />

        <VStack align="stretch" spacing={spacing}>
          {/* Header with label and icon */}
          <Flex justify="space-between" align="flex-start" gap={2}>
            <Text
              fontSize={labelSize}
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="wider"
              fontWeight="medium"
              noOfLines={1}
              flex={1}
            >
              {label}
            </Text>
            
            {icon && (
              <Icon 
                as={icon} 
                boxSize={iconSize} 
                color={currentColorScheme.color}
                flexShrink={0}
              />
            )}
          </Flex>

          {/* Value and trend */}
          <Flex align="flex-end" justify="space-between" gap={2}>
            <HStack align="flex-end" spacing={2} flex={1}>
              <Heading 
                size={headingSize} 
                color={valueColor}
                noOfLines={1}
                fontWeight="bold"
              >
                {isLoading ? '...' : value}
              </Heading>
              
              {trend && trendValue && (
                <Badge
                  colorScheme={trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'gray'}
                  variant="subtle"
                  fontSize={helperSize}
                  fontWeight="medium"
                >
                  {currentTrend?.icon} {trendValue}
                </Badge>
              )}
            </HStack>

            {/* Standalone trend indicator */}
            {trend && !trendValue && (
              <Text 
                fontSize={helperSize}
                color={currentTrend?.color}
                fontWeight="bold"
                flexShrink={0}
              >
                {currentTrend?.icon}
              </Text>
            )}
          </Flex>

          {/* Helper text */}
          {helperText && (
            <Text 
              fontSize={helperSize} 
              color={labelColor}
              noOfLines={2}
              lineHeight="short"
            >
              {helperText}
            </Text>
          )}
        </VStack>

        {/* Loading shimmer effect */}
        {isLoading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
            animation="shimmer 1.5s infinite"
          />
        )}
      </Box>
    </Tooltip>
  );
};

// Compact variant for tighter spaces
export const CompactStatCard = (props: StatCardProps) => (
  <StatCard size="sm" {...props} />
);

// Highlight variant for important metrics
export const HighlightStatCard = (props: StatCardProps) => (
  <StatCard 
    size="lg" 
    bg={useColorModeValue('brand.50', 'brand.900')}
    borderColor={useColorModeValue('brand.200', 'brand.700')}
    {...props} 
  />
);

// Add CSS for shimmer animation
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Inject styles (you might want to do this in your global CSS instead)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = shimmerStyles;
  document.head.appendChild(styleSheet);
}
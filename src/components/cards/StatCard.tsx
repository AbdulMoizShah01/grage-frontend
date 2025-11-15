import { ReactNode } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Icon, 
  HStack, 
  VStack, 
  Tooltip,
  useColorModeValue,
  Badge,
  CircularProgress,
  CircularProgressLabel,
  useBreakpointValue
} from '@chakra-ui/react';
import { FiHelpCircle, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

type StatCardProps = {
  label: string;
  value: ReactNode;
  helperText?: string;
  icon?: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  colorScheme?: 'brand' | 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'subtle';
  onClick?: () => void;
  progressValue?: number;
  showProgress?: boolean;
};

export const StatCard = ({ 
  label, 
  value, 
  helperText, 
  icon,
  trend,
  colorScheme = 'brand',
  isLoading = false,
  size = 'md',
  variant = 'default',
  onClick,
  progressValue,
  showProgress = false
}: StatCardProps) => {
  // Responsive values
  const responsivePadding = useBreakpointValue({
    base: 3,
    sm: size === 'sm' ? 3 : size === 'lg' ? 6 : 4,
    md: size === 'sm' ? 4 : size === 'lg' ? 8 : 6
  });

  const responsiveValueSize = useBreakpointValue({
    base: size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md',
    sm: size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'
  });

  const responsiveIconSize = useBreakpointValue({
    base: 3,
    sm: size === 'sm' ? 3 : size === 'lg' ? 5 : 4
  });

  const progressSize = useBreakpointValue({
    base: '20px',
    sm: '24px',
    md: '32px'
  });

  const progressLabelSize = useBreakpointValue({
    base: '2xs',
    sm: '2xs'
  });

  // Color values based on color mode and scheme
  const bgColor = useColorModeValue(
    variant === 'subtle' ? 'gray.50' : 'white',
    variant === 'subtle' ? 'gray.700' : 'gray.800'
  );
  
  const borderColor = useColorModeValue(
    variant === 'outline' ? 'gray.200' : 'transparent',
    variant === 'outline' ? 'gray.600' : 'transparent'
  );
  
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const shadow = variant === 'default' ? 'sm' : 'none';
  
  // Color scheme configuration
  const colorConfig = {
    brand: { color: 'blue.500', light: 'blue.50', dark: 'blue.100' },
    green: { color: 'green.500', light: 'green.50', dark: 'green.100' },
    red: { color: 'red.500', light: 'red.50', dark: 'red.100' },
    orange: { color: 'orange.500', light: 'orange.50', dark: 'orange.100' },
    blue: { color: 'blue.500', light: 'blue.50', dark: 'blue.100' },
    purple: { color: 'purple.500', light: 'purple.50', dark: 'purple.100' },
    gray: { color: 'gray.500', light: 'gray.50', dark: 'gray.100' }
  };

  const colors = colorConfig[colorScheme];

  if (isLoading) {
    return (
      <Box
        bg={bgColor}
        borderRadius="xl"
        boxShadow={shadow}
        p={responsivePadding}
        borderWidth={variant === 'outline' ? '1px' : '0'}
        borderColor={borderColor}
        opacity={0.6}
        w="full"
      >
        <Flex direction="column" gap={2}>
          <Flex align="center" gap={2}>
            <Box w="60%" h="16px" bg="gray.200" borderRadius="md" />
          </Flex>
          <Box w="80%" h="24px" bg="gray.300" borderRadius="md" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      boxShadow={shadow}
      p={responsivePadding}
      borderWidth={variant === 'outline' ? '1px' : '0'}
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={onClick ? { 
        shadow: 'md', 
        transform: { base: 'none', md: 'translateY(-2px)' },
        bg: hoverBg,
        cursor: 'pointer'
      } : {}}
      onClick={onClick}
      position="relative"
      overflow="hidden"
      w="full"
      minW="0"
    >
      {/* Progress indicator - smaller on mobile */}
      {showProgress && progressValue !== undefined && (
        <Box position="absolute" top={2} right={2}>
          <CircularProgress 
            value={progressValue} 
            size={progressSize}
            thickness="8px"
            color={colors.color}
          >
            <CircularProgressLabel fontSize={progressLabelSize}>
              {progressValue}%
            </CircularProgressLabel>
          </CircularProgress>
        </Box>
      )}

      <Flex direction="column" gap={2} w="full">
        {/* Header with label and icon - compact on mobile */}
        <Flex 
          justify="space-between" 
          align="flex-start" 
          gap={1}
          direction="row"
        >
          <HStack spacing={1} align="center" flex={1} minW="0">
            {icon && (
              <Icon 
                as={icon} 
                color={colors.color} 
                boxSize={responsiveIconSize}
                flexShrink={0}
              />
            )}
            <Text 
              fontSize={{ 
                base: '2xs', 
                sm: size === 'sm' ? 'xs' : 'sm'
              }}
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
              fontWeight="medium"
              noOfLines={1}
              minW="0"
            >
              {label}
            </Text>
          </HStack>
          
          {/* Trend indicator - smaller on mobile */}
          {trend && (
            <Badge 
              colorScheme={trend.isPositive ? 'green' : 'red'}
              variant="subtle"
              fontSize={{ base: '2xs', sm: 'xs' }}
              display="flex"
              alignItems="center"
              gap={1}
              flexShrink={0}
            >
              <Icon 
                as={trend.isPositive ? FiTrendingUp : FiTrendingDown} 
                boxSize={2} 
              />
              {trend.value}%
            </Badge>
          )}
        </Flex>

        {/* Value - smaller font but full display on mobile */}
        <VStack align="flex-start" spacing={0} w="full" minW="0">
          <Box 
            fontSize={{
              base: responsiveValueSize === 'lg' ? 'md' : 
                    responsiveValueSize === 'xl' ? 'lg' : 'sm',
              sm: responsiveValueSize === 'lg' ? 'lg' : 
                  responsiveValueSize === 'xl' ? 'xl' : 'md'
            }}
            color={useColorModeValue('gray.900', 'white')}
            fontWeight="bold"
            lineHeight="shorter"
            w="full"
            minW="0"
            css={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {value}
          </Box>
          
          {/* Helper text - only show if there's space */}
          {helperText && (
            <HStack spacing={1} align="center" w="full" minW="0" mt={1}>
              <Text 
                fontSize={{ 
                  base: '2xs', 
                  sm: size === 'sm' ? 'xs' : 'sm'
                }}
                color="gray.500"
                noOfLines={1}
                minW="0"
              >
                {helperText}
              </Text>
              <Tooltip label={helperText} placement="top">
                <Box flexShrink={0}>
                  <Icon as={FiHelpCircle} color="gray.400" boxSize={2} />
                </Box>
              </Tooltip>
            </HStack>
          )}
        </VStack>
      </Flex>

      {/* Decorative accent */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w="3px"
        h="full"
        bg={colors.color}
        opacity={0.8}
        borderTopLeftRadius="xl"
        borderBottomLeftRadius="xl"
      />
    </Box>
  );
};
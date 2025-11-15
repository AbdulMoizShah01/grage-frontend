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
  CircularProgressLabel
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
  
  // Size variants
  const sizeConfig = {
    sm: { padding: 4, headingSize: 'md', gap: 2, iconSize: 4, labelFontSize: 'xs', helperFontSize: 'xs', progressSize: '32px', progressLabelSize: '2xs' },
    md: { padding: 6, headingSize: 'lg', gap: 2, iconSize: 5, labelFontSize: 'sm', helperFontSize: 'sm', progressSize: '36px', progressLabelSize: 'xs' },
    lg: { padding: 8, headingSize: 'xl', gap: 3, iconSize: 6, labelFontSize: 'sm', helperFontSize: 'md', progressSize: '40px', progressLabelSize: 'xs' }
  };

  const { padding, headingSize, gap, iconSize, labelFontSize, helperFontSize, progressSize, progressLabelSize } = sizeConfig[size];

  // Color scheme configuration
  const colorConfig = {
    brand: { color: 'blue.500', light: 'brand.50', dark: 'brand.100' },
    green: { color: 'blue.500', light: 'green.50', dark: 'green.100' },
    red: { color: 'blue.500', light: 'red.50', dark: 'red.100' },
    orange: { color: 'blue.500', light: 'orange.50', dark: 'orange.100' },
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
        p={padding}
        borderWidth={variant === 'outline' ? '1px' : '0'}
        borderColor={borderColor}
        opacity={0.6}
      >
        <Flex direction="column" gap={gap}>
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
      p={padding}
      borderWidth={variant === 'outline' ? '1px' : '0'}
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={onClick ? { 
        shadow: 'md', 
        transform: 'translateY(-2px)',
        bg: hoverBg,
        cursor: 'pointer'
      } : {}}
      onClick={onClick}
      position="relative"
      overflow="hidden"
      w="full"
    >
      {/* Progress indicator */}
      {showProgress && progressValue !== undefined && (
        <Box position="absolute" top={3} right={3}>
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

      <Flex direction="column" gap={gap}>
        {/* Header with label and icon */}
        <Flex justify="space-between" align="flex-start" gap={2}>
          <HStack spacing={2} align="center" flex={1}>
            {icon && (
              <Icon 
                as={icon} 
                color={colors.color} 
                boxSize={iconSize}
                mt={0.5}
              />
            )}
            <Text 
              fontSize={labelFontSize}
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
              fontWeight="medium"
              noOfLines={1}
            >
              {label}
            </Text>
          </HStack>
          
          {/* Trend indicator */}
          {trend && (
            <Badge 
              colorScheme={trend.isPositive ? 'green' : 'red'}
              variant="subtle"
              fontSize="xs"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Icon 
                as={trend.isPositive ? FiTrendingUp : FiTrendingDown} 
                boxSize={3} 
              />
              {trend.value}%
            </Badge>
          )}
        </Flex>

        {/* Value and helper text */}
        <VStack align="flex-start" spacing={1}>
          <Heading 
            size={headingSize}
            color={useColorModeValue('gray.900', 'white')}
            fontWeight="bold"
            noOfLines={1}
          >
            {value}
          </Heading>
          
          {helperText && (
            <HStack spacing={1} align="center">
              <Text 
                fontSize={helperFontSize}
                color="gray.500"
                noOfLines={1}
              >
                {helperText}
              </Text>
              <Tooltip label={helperText} placement="top">
                <Box>
                  <Icon as={FiHelpCircle} color="gray.400" boxSize={3} />
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
        w="4px"
        h="full"
        bg={colors.color}
        opacity={0.8}
        borderTopLeftRadius="xl"
        borderBottomLeftRadius="xl"
      />
    </Box>
  );
};

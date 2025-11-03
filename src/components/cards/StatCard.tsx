import { ReactNode } from 'react';
import { Box, Heading, Text, Flex } from '@chakra-ui/react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  helperText?: string;
};

export const StatCard = ({ label, value, helperText }: StatCardProps) => (
  <Box bg="white" borderRadius="xl" boxShadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
    <Flex direction="column" gap={2}>
      <Text fontSize="sm" color="gray.500" textTransform="uppercase" letterSpacing="wider">
        {label}
      </Text>
      <Heading size="lg">{value}</Heading>
      {helperText ? (
        <Text fontSize="sm" color="gray.500">
          {helperText}
        </Text>
      ) : null}
    </Flex>
  </Box>
);

import { Box, Skeleton, Table } from '@chakra-ui/react'

type ProcessListSkeletonProps = {
  count?: number
}

const SkeletonRow = () => (
  <Table.Row>
    <Table.Cell>
      <Skeleton h='4' w='60%' />
    </Table.Cell>
    <Table.Cell>
      <Skeleton h='4' w='24' />
    </Table.Cell>
    <Table.Cell>
      <Skeleton h='4' w='24' />
    </Table.Cell>
    <Table.Cell>
      <Skeleton h='5' w='16' borderRadius='full' />
    </Table.Cell>
    <Table.Cell>
      <Skeleton h='5' w='16' borderRadius='full' />
    </Table.Cell>
    <Table.Cell textAlign='end'>
      <Skeleton h='4' w='8' ml='auto' />
    </Table.Cell>
    <Table.Cell>
      <Skeleton h='5' w='14' borderRadius='full' />
    </Table.Cell>
    <Table.Cell textAlign='end'>
      <Skeleton h='8' w='8' ml='auto' />
    </Table.Cell>
  </Table.Row>
)

const ProcessListSkeleton = ({ count = 5 }: ProcessListSkeletonProps) => (
  <Box border='1px solid' borderColor='table.border' borderRadius='sm' w='full' data-testid='process-list-skeleton'>
    <Table.ScrollArea>
      <Table.Root variant='outline'>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>
              <Skeleton h='4' w='12' />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <Skeleton h='4' w='20' />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <Skeleton h='4' w='16' />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <Skeleton h='4' w='10' />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <Skeleton h='4' w='12' />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <Skeleton h='4' w='16' ml='auto' />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <Skeleton h='4' w='14' />
            </Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: count }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  </Box>
)

export default ProcessListSkeleton

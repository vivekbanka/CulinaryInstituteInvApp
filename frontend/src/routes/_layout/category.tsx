import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { ItemCategoryService } from "@/client"
import { CategoryActionsMenu } from "@/components/Category/CategoryActionMenu"
import AddCategory from "@/components/Category/AddCategory"
import PendingItems from "@/components/Pending/PendingItems"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const itemsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getCategoryQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
        ItemCategoryService.readItemCategories({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
}

export const Route = createFileRoute("/_layout/category")({
  component: Category,
  validateSearch: (search) => itemsSearchSchema.parse(search),
})

function CategoryTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getCategoryQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const items = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingItems />
  }

  if (items.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any categories yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new categories to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="30%">ID</Table.ColumnHeader>
            <Table.ColumnHeader w="30%">Category Description</Table.ColumnHeader>
            <Table.ColumnHeader w="30%">Category Code</Table.ColumnHeader>
            <Table.ColumnHeader w="10%">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items?.map((item) => (
            <Table.Row key={item.item_category_id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="30%">
                {item.item_category_id}
              </Table.Cell>
              <Table.Cell truncate maxW="30%">
                {item.item_category_name}
              </Table.Cell>
              <Table.Cell
                color={!item.item_category_code ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {item.item_category_code || "N/A"}
              </Table.Cell>
              <Table.Cell width="10%">
                <CategoryActionsMenu item={item} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Category() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Category Management
      </Heading>
      <AddCategory />
      <CategoryTable />
    </Container>
  )
}

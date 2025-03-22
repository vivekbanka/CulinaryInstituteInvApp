import {
  Button,
  Container,
  EmptyState,
  Flex,
  Heading,
  HStack,
  Input,
  Table,
  VStack,
} from "@chakra-ui/react"
import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { useState } from "react"
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
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

const PER_PAGE = 5

function getCategoryQueryOptions({ page, search, sortBy, sortOrder }: { 
  page: number,
  search?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
}) {
  return {
    queryFn: () =>
        ItemCategoryService.readItemCategories({ 
          skip: (page - 1) * PER_PAGE, 
          limit: PER_PAGE,
          search,
          sortBy,
          sortOrder,
        }),
    queryKey: ["items", { page, search, sortBy, sortOrder }],
  }
}

export const Route = createFileRoute("/_layout/category")({
  component: Category,
  validateSearch: (search) => itemsSearchSchema.parse(search),
})

function CategoryTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page = 1, search = "", sortBy = "", sortOrder = "asc" } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(search || "")
  
  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getCategoryQueryOptions({ 
      page: Number(page), 
      search: search ? String(search) : undefined, 
      sortBy: sortBy ? String(sortBy) : undefined, 
      sortOrder: sortOrder === "desc" ? "desc" : "asc" 
    }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (newPage: number) =>
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
    
  const handleSearch = () => {
    navigate({
      search: (prev) => ({ ...prev, page: 1, search: searchInput }),
    })
  }
  
  const handleSort = (field: string) => {
    let newSortOrder: "asc" | "desc" = "asc"
    
    if (sortBy === field && sortOrder === "asc") {
      newSortOrder = "desc"
    }
    
    navigate({
      search: (prev) => ({ ...prev, sortBy: field, sortOrder: newSortOrder }),
    })
  }
  
  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return ""
    return sortOrder === "asc" ? " ↑" : " ↓"
  }

  const items = data?.data?.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingItems />
  }

  if (items.length === 0 && !search) {
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
  
  if (items.length === 0 && search) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No results found</EmptyState.Title>
            <EmptyState.Description>
              Try a different search term
            </EmptyState.Description>
            <Button 
              onClick={() => {
                setSearchInput("")
                navigate({
                  search: (prev) => ({ ...prev, page: 1, search: undefined }),
                })
              }}
              mt={4}
            >
              Clear Search
            </Button>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <HStack spacing={4} mb={4}>
        <FormControl>
          <FormLabel htmlFor="search">Search</FormLabel>
          <Input
            id="search"
            placeholder="Search categories..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
        </FormControl>
        <Button alignSelf="end" onClick={handleSearch}>
          Search
        </Button>
        {searchInput && (
          <Button 
            alignSelf="end" 
            variant="outline"
            onClick={() => {
              setSearchInput("")
              if (search) {
                navigate({
                  search: (prev) => ({ ...prev, page: 1, search: undefined }),
                })
              }
            }}
          >
            Clear
          </Button>
        )}
      </HStack>
      
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader 
              w="30%" 
              cursor="pointer" 
              onClick={() => handleSort("item_category_id")}
            >
              ID{getSortIndicator("item_category_id")}
            </Table.ColumnHeader>
            <Table.ColumnHeader 
              w="30%" 
              cursor="pointer" 
              onClick={() => handleSort("item_category_name")}
            >
              Category Description{getSortIndicator("item_category_name")}
            </Table.ColumnHeader>
            <Table.ColumnHeader 
              w="30%" 
              cursor="pointer" 
              onClick={() => handleSort("item_category_code")}
            >
              Category Code{getSortIndicator("item_category_code")}
            </Table.ColumnHeader>
            <Table.ColumnHeader w="10%">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items && items.map((item) => (
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
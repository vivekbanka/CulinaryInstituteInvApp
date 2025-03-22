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
    Box,
    Text,
    NativeSelect,
  } from "@chakra-ui/react"
  import { FormControl, FormLabel } from "@chakra-ui/form-control"
  import { useQuery } from "@tanstack/react-query"
  import { createFileRoute, useNavigate } from "@tanstack/react-router"
  import { FiSearch } from "react-icons/fi"
  import { useState, useEffect } from "react"
  import { z } from "zod"
  
  import { ItemCategoryService,  ItemSubCategoryService } from "@/client"
  import { SubCategoryActionsMenu } from "@/components/Subcategory/SubCategoryActionsMenu"
  import AddSubcategory from "@/components/Subcategory/AddSubcategory"
  import PendingItems from "@/components/Pending/PendingItems"
  import {
    PaginationItems,
    PaginationNextTrigger,
    PaginationPrevTrigger,
    PaginationRoot,
  } from "@/components/ui/pagination.tsx"
  
  const subcategorySearchSchema = z.object({
    page: z.number().catch(1),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  
  const PER_PAGE = 5
  
  function getSubcategoryQueryOptions({ page, search, sortBy, sortOrder }: { 
    page: number,
    search?: string,
    categoryId?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  }) {
    return {
      queryFn: () =>
        ItemSubCategoryService.readItemSubcategories({ 
            skip: (page - 1) * PER_PAGE, 
            limit: PER_PAGE,
            search,
            sortBy,
            sortOrder,
          }),
      queryKey: ["subcategories", { page, search, sortBy, sortOrder }],
    }
  }
  
  export const Route = createFileRoute("/_layout/subcategory")({
    component: Subcategory,
    validateSearch: (search) => subcategorySearchSchema.parse(search),
  })
  
  function CategorySelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
    const { data, isLoading } = useQuery({
      queryFn: () => ItemCategoryService.readItemCategories({ limit: 100 }),
      queryKey: ["categories-dropdown"],
    })
  
    const categories = data?.data || []
  
    return (
      <FormControl>
        <NativeSelect.Root key="plain" variant="plain">
          <NativeSelect.Field
            placeholder="Filter Category"
            onChange={(e) => onChange(e.target.value)}
          >
            {Array.isArray(categories) &&
              categories.map((category) => (
                <option
                  key={category.item_category_id}
                  value={category.item_category_id}
                >
                  {category.item_category_name}
                </option>
              ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </FormControl>
    );
  }
  
  function SubcategoryTable() {
    const navigate = useNavigate({ from: Route.fullPath })
    const { page = 1, search = "", categoryId = "", sortBy = "", sortOrder = "asc" } = Route.useSearch()
    const [searchInput, setSearchInput] = useState(search || "")
    const [selectedCategory, setSelectedCategory] = useState(categoryId || "")
    
    // Update local state when URL parameters change
    useEffect(() => {
      setSearchInput(search || "")
      setSelectedCategory(categoryId || "")
    }, [search, categoryId])
    
    const { data, isLoading, isPlaceholderData } = useQuery({
      ...getSubcategoryQueryOptions({ 
        page: Number(page), 
        search: search ? String(search) : undefined, 
        categoryId: categoryId ? String(categoryId) : undefined,
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
    
    const handleCategoryChange = (value: string) => {
      setSelectedCategory(value)
      navigate({
        search: (prev) => ({ ...prev, page: 1, categoryId: value || undefined }),
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
  
    if (items.length === 0 && !search && !categoryId) {
      return (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>You don't have any subcategories yet</EmptyState.Title>
              <EmptyState.Description>
                Add a new subcategory to get started
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      )
    }
    
    if (items.length === 0 && (search || categoryId)) {
      return (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No results found</EmptyState.Title>
              <EmptyState.Description>
                Try a different search term or category filter
              </EmptyState.Description>
              <HStack mt={4}>
                {search && (
                  <Button 
                    onClick={() => {
                      setSearchInput("")
                      navigate({
                        search: (prev) => ({ ...prev, page: 1, search: undefined }),
                      })
                    }}
                  >
                    Clear Search
                  </Button>
                )}
                {categoryId && (
                  <Button 
                    onClick={() => {
                      setSelectedCategory("")
                      navigate({
                        search: (prev) => ({ ...prev, page: 1, categoryId: undefined }),
                      })
                    }}
                  >
                    Clear Category Filter
                  </Button>
                )}
              </HStack>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      )
    }
  
    return (
      <>
        <HStack mb={4} alignItems="flex-end" wrap="wrap" gap={4}>
          <FormControl maxW={{ base: "100%", md: "300px" }}>
            <FormLabel htmlFor="search">Search</FormLabel>
            <Input
              id="search"
              placeholder="Search subcategories..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
            />
          </FormControl>
          <Button onClick={handleSearch}>
            Search
          </Button>
          {searchInput && (
            <Button 
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
          
          <Box maxW={{ base: "100%", md: "300px" }} w="100%">
            <CategorySelect 
              value={selectedCategory} 
              onChange={handleCategoryChange} 
            />
          </Box>

        </HStack>
        
        {(search || categoryId) && (
          <Box mb={4}>
            <Text fontSize="sm" color="gray.600">
              {count} result{count !== 1 ? 's' : ''} found
              {categoryId && " in selected category"}
              {search && ` for "${search}"`}
            </Text>
          </Box>
        )}
        
        <Table.Root size={{ base: "sm", md: "md" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader 
                w="20%" 
                cursor="pointer" 
                onClick={() => handleSort("subcategory_id")}
              >
                ID{getSortIndicator("subcategory_id")}
              </Table.ColumnHeader>
              <Table.ColumnHeader 
                w="25%" 
                cursor="pointer" 
                onClick={() => handleSort("subcategory_name")}
              >
                Subcategory Name{getSortIndicator("subcategory_name")}
              </Table.ColumnHeader>
              <Table.ColumnHeader 
                w="25%" 
                cursor="pointer" 
                onClick={() => handleSort("subcategory_code")}
              >
                Subcategory Code{getSortIndicator("subcategory_code")}
              </Table.ColumnHeader>
              <Table.ColumnHeader 
                w="20%" 
                cursor="pointer" 
                onClick={() => handleSort("category_name")}
              >
                Category{getSortIndicator("category_name")}
              </Table.ColumnHeader>
              <Table.ColumnHeader w="10%">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items && items.map((item) => (
              <Table.Row key={item.item_subcategory_id} opacity={isPlaceholderData ? 0.5 : 1}>
                <Table.Cell truncate maxW="20%">
                  {item.item_subcategory_id}
                </Table.Cell>
                <Table.Cell truncate maxW="25%">
                  {item.item_subcategory_name}
                </Table.Cell>
                <Table.Cell
                  color={!item.item_subcategory_name ? "gray" : "inherit"}
                  truncate
                  maxW="25%"
                >
                  {item.item_subcategory_code || "N/A"}
                </Table.Cell>
                <Table.Cell truncate maxW="20%">
                  {item.category.item_category_name}
                </Table.Cell>
                <Table.Cell width="10%">
                  <SubCategoryActionsMenu item={item} />
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
  
  function Subcategory() {
    const { categoryId } = Route.useSearch()
  
    return (
      <Container maxW="full">
        <Heading size="lg" pt={12}>
          Subcategory Management
        </Heading>
        <AddSubcategory preselectedCategoryId={categoryId} />
        <SubcategoryTable />
      </Container>
    )
  }
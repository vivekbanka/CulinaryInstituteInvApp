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
  
  import { RoleService, RoleClaimsService } from "@/client"
  import { RoleClaimActionsMenu } from "@/components/RolesClaims/RolesClaimActionsMenu"
  import AddRoleClaim from "@/components/RolesClaims/AddRoleClaim"
  import PendingItems from "@/components/Pending/PendingItems"
  import {
    PaginationItems,
    PaginationNextTrigger,
    PaginationPrevTrigger,
    PaginationRoot,
  } from "@/components/ui/pagination.tsx"
  
  const roleClaimSearchSchema = z.object({
    page: z.number().catch(1),
    search: z.string().optional(),
    roleId: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  
  const PER_PAGE = 5
  
  function getRoleClaimQueryOptions({ page, search, roleId, sortBy, sortOrder }: { 
    page: number,
    search?: string,
    roleId?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  }) {
    return {
      queryFn: () =>
        RoleClaimsService.readRoleClaims({ 
            skip: (page - 1) * PER_PAGE, 
            limit: PER_PAGE,
            search,
            sortBy,
            sortOrder,
          }),
      queryKey: ["roleclaims", { page, search, roleId, sortBy, sortOrder }],
    }
  }
  
  export const Route = createFileRoute("/_layout/rolesclaims")({
    component: RoleClaim,
    validateSearch: (search) => roleClaimSearchSchema.parse(search),
  })
  
  function RoleSelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
    const { data, isLoading } = useQuery({
      queryFn: () => RoleService.readRoles({ limit: 100 }),
      queryKey: ["roles-dropdown"],
    })
  
    const roles = data?.data || []
  
    return (
      <FormControl>
        <NativeSelect.Root key="plain" variant="plain">
          <NativeSelect.Field
            placeholder="Filter Role"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">All Roles</option>
            {Array.isArray(roles) &&
              roles.map((role) => (
                <option
                  key={role.role_id}
                  value={role.role_id}
                >
                  {role.role_name}
                </option>
              ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </FormControl>
    );
  }
  
  function RoleClaimTable() {
    const navigate = useNavigate({ from: Route.fullPath })
    const { page = 1, search = "", roleId = "", sortBy = "", sortOrder = "asc" } = Route.useSearch()
    const [searchInput, setSearchInput] = useState(search || "")
    const [selectedRole, setSelectedRole] = useState(roleId || "")
    
    // Update local state when URL parameters change
    useEffect(() => {
      setSearchInput(search || "")
      setSelectedRole(roleId || "")
    }, [search, roleId])
    
    const { data, isLoading, isPlaceholderData } = useQuery({
      ...getRoleClaimQueryOptions({ 
        page: Number(page), 
        search: search ? String(search) : undefined, 
        roleId: roleId ? String(roleId) : undefined,
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
    
    const handleRoleChange = (value: string) => {
      setSelectedRole(value)
      navigate({
        search: (prev) => ({ ...prev, page: 1, roleId: value || undefined }),
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
  
    if (items.length === 0 && !search && !roleId) {
      return (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>You don't have any role claims yet</EmptyState.Title>
              <EmptyState.Description>
                Add a new role claim to get started
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      )
    }
    
    if (items.length === 0 && (search || roleId)) {
      return (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No results found</EmptyState.Title>
              <EmptyState.Description>
                Try a different search term or role filter
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
                {roleId && (
                  <Button 
                    onClick={() => {
                      setSelectedRole("")
                      navigate({
                        search: (prev) => ({ ...prev, page: 1, roleId: undefined }),
                      })
                    }}
                  >
                    Clear Role Filter
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
              placeholder="Search role claims..."
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
            <RoleSelect 
              value={selectedRole} 
              onChange={handleRoleChange} 
            />
          </Box>
        </HStack>
        
        {(search || roleId) && (
          <Box mb={4}>
            <Text fontSize="sm" color="gray.600">
              {count} result{count !== 1 ? 's' : ''} found
              {roleId && " in selected role"}
              {search && ` for "${search}"`}
            </Text>
          </Box>
        )}
        
        <Table.Root size={{ base: "sm", md: "md" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader 
                w="15%" 
                cursor="pointer" 
                onClick={() => handleSort("role_claim_id")}
              >
                ID{getSortIndicator("role_claim_id")}
              </Table.ColumnHeader>
              <Table.ColumnHeader 
                w="20%" 
                cursor="pointer" 
                onClick={() => handleSort("role_claim_type")}
              >
                Claim Type{getSortIndicator("role_claim_type")}
              </Table.ColumnHeader>
              <Table.ColumnHeader 
                w="25%" 
                cursor="pointer" 
                onClick={() => handleSort("role_claim_value")}
              >
                Claim Value{getSortIndicator("role_claim_value")}
              </Table.ColumnHeader>
              {/* <Table.ColumnHeader 
                w="15%" 
                cursor="pointer" 
                onClick={() => handleSort("role_name")}
              >
                Role{getSortIndicator("role_name")}
              </Table.ColumnHeader> */}
              <Table.ColumnHeader 
                w="15%" 
                cursor="pointer" 
                onClick={() => handleSort("role_claim_isactive")}
              >
                Status{getSortIndicator("role_claim_isactive")}
              </Table.ColumnHeader>
              <Table.ColumnHeader w="10%">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items && items.map((item) => (
              <Table.Row key={item.role_claim_id} opacity={isPlaceholderData ? 0.5 : 1}>
                <Table.Cell truncate maxW="15%">
                  {item.role_claim_id}
                </Table.Cell>
                <Table.Cell truncate maxW="20%">
                  {item.role_claim_type}
                </Table.Cell>
                <Table.Cell truncate maxW="25%">
                  {item.role_claim_value}
                </Table.Cell>
                {/* <Table.Cell truncate maxW="15%">
                  {item.role.role_name}
                </Table.Cell> */}
                <Table.Cell truncate maxW="15%">
                  {item.role_claim_isactive ? "Active" : "Inactive"}
                </Table.Cell>
                <Table.Cell width="10%">
                  <RoleClaimActionsMenu item={item} />
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
  
  function RoleClaim() {
    const { roleId } = Route.useSearch()
  
    return (
      <Container maxW="full">
        <Heading size="lg" pt={12}>
          Role Claims Management
        </Heading>
        <AddRoleClaim preselectedRoleId={roleId} />
        <RoleClaimTable />
      </Container>
    )
  }
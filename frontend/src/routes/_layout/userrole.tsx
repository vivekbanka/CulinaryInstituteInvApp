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

import { RoleService, UsersService, UserRoleService } from "@/client"
import { UserRoleActionsMenu } from "@/components/UserRole/UserRoleActionsMenu"
import AddUserRole from "@/components/UserRole/AddUserRole"
import PendingItems from "@/components/Pending/PendingItems"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const userRoleSearchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().optional(),
  roleId: z.string().optional(),
  userId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

const PER_PAGE = 5

function getUserRoleQueryOptions({ page, search, roleId, userId, sortBy, sortOrder }: { 
  page: number,
  search?: string,
  roleId?: string,
  userId?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
}) {
  return {
    queryFn: () =>
      UserRoleService.readUserRoles({ 
          skip: (page - 1) * PER_PAGE, 
          limit: PER_PAGE,
        }),
    queryKey: ["userroles", { page, search, roleId, userId, sortBy, sortOrder }],
  }
}

export const Route = createFileRoute("/_layout/userrole")({
  component: UserRoleManagement,
  validateSearch: (search) => userRoleSearchSchema.parse(search),
})

function RoleSelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const { data, isLoading } = useQuery({
    queryFn: () => RoleService.readRoles({ limit: 100 }),
    queryKey: ["roles-dropdown"],
  })

  const roles = data?.data || []

  return (
    <FormControl>
      <FormLabel>Filter by Role</FormLabel>
      <NativeSelect.Root key="plain" variant="plain">
        <NativeSelect.Field
          placeholder="Select Role"
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

function UserSelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const { data, isLoading } = useQuery({
    queryFn: () => UsersService.readUsers({ limit: 100 }),
    queryKey: ["users-dropdown"],
  })

  const users = data?.data || []

  return (
    <FormControl>
      <FormLabel>Filter by User</FormLabel>
      <NativeSelect.Root key="plain" variant="plain">
        <NativeSelect.Field
          placeholder="Select User"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">All Users</option>
          {Array.isArray(users) &&
            users.map((user) => (
              <option
                key={user.id}
                value={user.id}
              >
                {user.email || user.full_name || user.id}
              </option>
            ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </FormControl>
  );
}

function UserRoleTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page = 1, search = "", roleId = "", userId = "", sortBy = "", sortOrder = "asc" } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(search || "")
  const [selectedRole, setSelectedRole] = useState(roleId || "")
  const [selectedUser, setSelectedUser] = useState(userId || "")
  
  // Update local state when URL parameters change
  useEffect(() => {
    setSearchInput(search || "")
    setSelectedRole(roleId || "")
    setSelectedUser(userId || "")
  }, [search, roleId, userId])
  
  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getUserRoleQueryOptions({ 
      page: Number(page), 
      search: search ? String(search) : undefined, 
      roleId: roleId ? String(roleId) : undefined,
      userId: userId ? String(userId) : undefined,
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
  
  const handleUserChange = (value: string) => {
    setSelectedUser(value)
    navigate({
      search: (prev) => ({ ...prev, page: 1, userId: value || undefined }),
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

  if (items.length === 0 && !search && !roleId && !userId) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any user role assignments yet</EmptyState.Title>
            <EmptyState.Description>
              Assign a role to a user to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }
  
  if (items.length === 0 && (search || roleId || userId)) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No results found</EmptyState.Title>
            <EmptyState.Description>
              Try a different search term or filter
            </EmptyState.Description>
            <HStack mt={4} flexWrap="wrap" justifyContent="center" gap={2}>
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
              {userId && (
                <Button 
                  onClick={() => {
                    setSelectedUser("")
                    navigate({
                      search: (prev) => ({ ...prev, page: 1, userId: undefined }),
                    })
                  }}
                >
                  Clear User Filter
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
      <HStack mb={4} alignItems="flex-start" wrap="wrap" gap={4}>
        <FormControl maxW={{ base: "100%", md: "300px" }}>
          <FormLabel htmlFor="search">Search</FormLabel>
          <Input
            id="search"
            placeholder="Search user roles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
        </FormControl>
        <Flex flexDirection="column" gap={2}>
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
        </Flex>
        
        <Box maxW={{ base: "100%", md: "300px" }} w="100%">
          <RoleSelect 
            value={selectedRole} 
            onChange={handleRoleChange} 
          />
        </Box>
        
        <Box maxW={{ base: "100%", md: "300px" }} w="100%">
          <UserSelect 
            value={selectedUser} 
            onChange={handleUserChange} 
          />
        </Box>
      </HStack>
      
      {(search || roleId || userId) && (
        <Box mb={4}>
          <Text fontSize="sm" color="gray.600">
            {count} result{count !== 1 ? 's' : ''} found
            {roleId && " for selected role"}
            {userId && " for selected user"}
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
              onClick={() => handleSort("user_role_id")}
            >
              ID{getSortIndicator("user_role_id")}
            </Table.ColumnHeader>
            {/* <Table.ColumnHeader 
              w="30%" 
              cursor="pointer" 
              onClick={() => handleSort("user_email")}
            >
              User{getSortIndicator("user_email")}
            </Table.ColumnHeader>
            <Table.ColumnHeader 
              w="25%" 
              cursor="pointer" 
              onClick={() => handleSort("role_name")}
            >
              Role{getSortIndicator("role_name")}
            </Table.ColumnHeader> */}
            <Table.ColumnHeader 
              w="15%" 
              cursor="pointer" 
              onClick={() => handleSort("is_active")}
            >
              Status{getSortIndicator("is_active")}
            </Table.ColumnHeader>
            <Table.ColumnHeader w="15%">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items && items.map((item) => (
            <Table.Row key={item.user_role_id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="15%">
                {item.user_role_id}
              </Table.Cell>
              {/* <Table.Cell truncate maxW="30%">
                {item.user.email || item.user.username || item.user_id}
              </Table.Cell>
              <Table.Cell truncate maxW="25%">
                {item.role.role_name}
              </Table.Cell> */}
              <Table.Cell truncate maxW="15%">
                {item.is_active ? "Active" : "Inactive"}
              </Table.Cell>
              <Table.Cell width="15%">
                <UserRoleActionsMenu item={item} />
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

function UserRoleManagement() {
  const { roleId, userId } = Route.useSearch()

  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        User Role Management
      </Heading>
      <AddUserRole preselectedRoleId={roleId} preselectedUserId={userId} />
      <UserRoleTable />
    </Container>
  )
}
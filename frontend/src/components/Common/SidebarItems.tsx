import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiBriefcase, FiHome, FiSettings, FiUsers } from "react-icons/fi"
import { FaUsersCog } from "react-icons/fa";
import { BiCategoryAlt } from "react-icons/bi";
import { FaCriticalRole } from "react-icons/fa";
import { FaUsersViewfinder, FaLocationDot } from "react-icons/fa6";
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const finalItems: Item[] = currentUser?.is_superuser
    ? [...items, 
      { icon: FiBriefcase, title: "Items", path: "/items" }, 
        {icon:BiCategoryAlt, title:"Category", path:"/category"},
        // {icon:MdOutlineCategory, title:"Sub Category", path:"/subcategory"},
        {icon:FaUsersCog, title:"Roles", path:"/roles"},
        {icon:FaUsersViewfinder, title:"Roles Claims", path:"/rolesclaims"},
        {icon:FaCriticalRole, title:"User Roles", path:"/userrole"},
        { icon: FiUsers, title: "Admin", path: "/admin"},
        { icon:FaLocationDot, title: "Location", path:"/location"}
      ]
    : items

  const listItems = finalItems.map(({ icon, title, path }) => (
    <RouterLink key={title} to={path} onClick={onClose}>
      <Flex
        gap={4}
        px={4}
        py={2}
        _hover={{
          background: "gray.subtle",
        }}
        alignItems="center"
        fontSize="sm"
      >
        <Icon as={icon} alignSelf="center" />
        <Text ml={2}>{title}</Text>
      </Flex>
    </RouterLink>
  ))

  return (
    <>
      <Text fontSize="xs" px={4} py={2} fontWeight="bold">
        Menu
      </Text>
      <Box>{listItems}</Box>
    </>
  )
}

export default SidebarItems

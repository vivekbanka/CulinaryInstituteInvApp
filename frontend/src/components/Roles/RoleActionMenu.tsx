import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import type { RolesPublic } from "../../client"
import DeleteRole from "./DeleteRole"
import EditRole from "./EditRole"

interface RoleActionsMenuProps {
  role: RolesPublic
}

export const RoleActionsMenu = ({ role }: RoleActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditRole role={role} />
        <DeleteRole id={role.role_id} />
      </MenuContent>
    </MenuRoot>
  )
}
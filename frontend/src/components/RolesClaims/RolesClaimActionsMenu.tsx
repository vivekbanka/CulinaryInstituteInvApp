import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { RolesClaimsPublic } from "../../client"
import DeleteRoleClaim from "./DeleteRoleClaim"
import EditRoleClaim from "./EditRoleClaim"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

interface RoleClaimActionsMenuProps {
  item: RolesClaimsPublic
}

export const RoleClaimActionsMenu = ({ item }: RoleClaimActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditRoleClaim item={item} />
        <DeleteRoleClaim id={item.role_claim_id} />
      </MenuContent>
    </MenuRoot>
  )
}
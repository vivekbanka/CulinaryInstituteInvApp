import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import type {  LocationsPublic } from "../../client"
import DeletLocation from "./DeleteLocation"
import EditLocation from "./EditLocation"

interface LocationActionsMenuProps {
  location: LocationsPublic
}

export const LocationActionsMenu = ({ location }: LocationActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditLocation location={location} />
        <DeletLocation id={location.location_id} />
      </MenuContent>
    </MenuRoot>
  )
}
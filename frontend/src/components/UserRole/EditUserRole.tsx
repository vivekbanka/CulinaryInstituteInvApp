import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import {
  Button,
  Text,
  VStack,
  Switch,
} from "@chakra-ui/react"
import {
  DialogActionTrigger,
  DialogTitle,
} from "../ui/dialog"
import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { useState } from "react"
import { FaExchangeAlt } from "react-icons/fa"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { type UserRolePublic } from "../../client"
import { type UserRoleUpdate } from "../../client"
import { UserRoleService } from "../../client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"

interface EditUserRoleProps {
  item: UserRolePublic
}

const EditUserRole = ({ item }: EditUserRoleProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UserRoleUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      is_active: item.is_active,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserRoleUpdate) =>
      UserRoleService.updateUserRole({
        id: item.user_role_id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("User role updated successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userroles"] })
    },
  })

  const onSubmit: SubmitHandler<UserRoleUpdate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        setIsOpen(open);
        if (open) {
          reset({
            is_active: item.is_active,
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FaExchangeAlt fontSize="16px" />
          Edit Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Update user role status for{" "}
              {item.user?.email || item.user?.username || "User"} as{" "}
              {item.role?.role_name || "Role"}.
            </Text>
            <VStack gap={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="is-active" mb="0">
                  Active
                </FormLabel>

                <Switch.Root>
                  <Switch.HiddenInput />
                  <Switch.Control id="is-active" {...register("is_active")} />
                </Switch.Root>
              </FormControl>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}

export default EditUserRole
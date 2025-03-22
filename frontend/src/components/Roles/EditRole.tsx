import {
    Button,
    ButtonGroup,
    DialogActionTrigger,
    Input,
    Text,
    Textarea,
    VStack,
  } from "@chakra-ui/react"
  import { useMutation, useQueryClient } from "@tanstack/react-query"
  import { useState } from "react"
  import { type SubmitHandler, useForm } from "react-hook-form"
  import { FaExchangeAlt } from "react-icons/fa"
  
  import { type ApiError, type RolesPublic, RoleService, RolesUpdate } from "../../client"
  import useCustomToast from "../../hooks/useCustomToast"
  import { handleError } from "../../utils"
  import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
  } from "../ui/dialog"
  import { Field } from "../ui/field"

  
  interface EditRoleProps {
    role: RolesPublic
  }
  
  interface RoleUpdateForm {
    role_name: string
    role_description?: string
  }
  
  const EditRole = ({ role }: EditRoleProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast } = useCustomToast()
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
    } = useForm<RoleUpdateForm>({
      mode: "onBlur",
      criteriaMode: "all",
      defaultValues: {
        ...role
      },
    })
  
    const mutation = useMutation({
      mutationFn: (data: RolesUpdate) =>
        RoleService.updateRole({ id: role.role_id, requestBody: data }),
      onSuccess: () => {
        showSuccessToast("Role updated successfully.")
        reset()
        setIsOpen(false)
      },
      onError: (err: ApiError) => {
        handleError(err)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["roles"] })
      },
    })
  
    const onSubmit: SubmitHandler<RoleUpdateForm> = async (data) => {
      mutation.mutate(data)
    }
  
    return (
      <DialogRoot
        size={{ base: "xs", md: "md" }}
        placement="center"
        open={isOpen}
        onOpenChange={({ open }) => setIsOpen(open)}
      >
        <DialogTrigger asChild>
          <Button variant="ghost">
            <FaExchangeAlt fontSize="16px" />
            Edit Role
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>Update the role details below.</Text>
              <VStack gap={4}>
                <Field
                  required
                  invalid={!!errors.role_name}
                  errorText={errors.role_name?.message}
                  label="Role Name"
                >
                  <Input
                    id="roleName"
                    {...register("role_name", {
                      required: "Role name is required",
                    })}
                    placeholder="Role Name"
                    type="text"
                  />
                </Field>
              </VStack>
            </DialogBody>
  
            <DialogFooter gap={2}>
              <ButtonGroup>
                <DialogActionTrigger asChild>
                  <Button
                    variant="subtle"
                    colorPalette="gray"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogActionTrigger>
                <Button variant="solid" type="submit" loading={isSubmitting}>
                  Save
                </Button>
              </ButtonGroup>
            </DialogFooter>
          </form>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    )
  }
  
  export default EditRole
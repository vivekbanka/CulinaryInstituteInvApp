import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import {
  Button,
  Input,
  Text,
  VStack,
  NativeSelect,
  Switch
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
import { type RolesClaimsPublic } from "../../client"
import { type RolesClaimsUpdate } from "../../client"
import { RoleClaimsService, RoleService } from "../../client"

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditRoleClaimProps {
  item: RolesClaimsPublic
}

const EditRoleClaim = ({ item }: EditRoleClaimProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RolesClaimsUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      role_claim_type: item.role_claim_type,
      role_claim_value: item.role_claim_value,
      role_id: item.role_id,
      role_claim_isactive: item.role_claim_isactive,
    },
  })

  // Fetch roles for dropdown
  const { data: rolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => RoleService.readRoles(),
  })
  
  // Extract roles array from response 
  const roles = rolesResponse?.data || []

  const mutation = useMutation({
    mutationFn: (data: RolesClaimsUpdate) =>
      RoleClaimsService.updateRoleClaim({
        id: item.role_claim_id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Role claim updated successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["roleclaims"] })
    },
  })

  const onSubmit: SubmitHandler<RolesClaimsUpdate> = (data) => {
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
            role_claim_type: item.role_claim_type,
            role_claim_value: item.role_claim_value,
            role_id: item.role_id,
            role_claim_isactive: item.role_claim_isactive,
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FaExchangeAlt fontSize="16px" />
          Edit Claim
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Role Claim</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the role claim details.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.role_id}
                errorText={errors.role_id?.message}
                label="Role"
              >
                <NativeSelect.Root key="plain" variant="plain">
                  <NativeSelect.Field
                    placeholder="Select Role"
                    {...register("role_id", {
                      required: "Role is required.",
                    })}
                  >
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
              </Field>

              <Field
                required
                invalid={!!errors.role_claim_type}
                errorText={errors.role_claim_type?.message}
                label="Claim Type"
              >
                <Input
                  id="claim-type"
                  {...register("role_claim_type", {
                    required: "Claim type is required.",
                  })}
                  placeholder="Claim Type"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.role_claim_value}
                errorText={errors.role_claim_value?.message}
                label="Claim Value"
              >
                <Input
                  id="claim-value"
                  {...register("role_claim_value", {
                    required: "Claim value is required.",
                  })}
                  placeholder="Claim Value"
                  type="text"
                />
              </Field>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="is-active" mb="0">
                  Active
                </FormLabel>
                <Switch.Root>
                  <Switch.HiddenInput />
                  <Switch.Control id="is-active"  {...register("role_claim_isactive")}/>
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

export default EditRoleClaim
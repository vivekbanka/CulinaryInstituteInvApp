import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  NativeSelect,
  Switch,
} from "@chakra-ui/react"
import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { RoleService } from "../../client"
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

import { RoleClaimsService } from "../../client";

// Define the types we need
interface RoleClaimCreate {
  role_claim_type: string;
  role_claim_value: string;
  role_id: string;
  role_claim_isactive: boolean;
}

interface AddRoleClaimProps {
  preselectedRoleId?: string;
}

const AddRoleClaim = ({ preselectedRoleId }: AddRoleClaimProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccessToast } = useCustomToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RoleClaimCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      role_claim_type: "",
      role_claim_value: "",
      role_id: preselectedRoleId || "",
      role_claim_isactive: true
    },
  });

  // Fetch roles for dropdown
  const { data: rolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => RoleService.readRoles(),
  });

  // Extract roles array from response 
  const roles = rolesResponse?.data || [];

  const mutation = useMutation({
    mutationFn: (data: RoleClaimCreate) =>
      RoleClaimsService.createRoleClaim({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Role claim created successfully.");
      reset();
      setIsOpen(false);
    },
    onError: (err: ApiError) => {
      handleError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["roleclaims"] });
    },
  });

  const onSubmit = (data: RoleClaimCreate) => {
    mutation.mutate(data);
  };

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-roleclaim" my={4}>
          <FaPlus fontSize="16px" />
          Add Role Claim
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Role Claim</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new Role Claim.</Text>
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
                        <option key={role.role_id} value={role.role_id}>
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
                  placeholder="Claim Type (e.g., Permission)"
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
                  placeholder="Claim Value (e.g., read:users)"
                  type="text"
                />
              </Field>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="is-active" mb="0">
                  Active
                </FormLabel>
                {/* <Switch
                  id="is-active"
                  {...register("role_claim_isactive")}
                  defaultChecked
                /> */}
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
};

export default AddRoleClaim;
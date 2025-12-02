import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Attachment } from '@/types'

const supabase = createSupabaseBrowserClient()

export function useAttachments(visitId: string) {
    return useQuery({
        queryKey: ['attachments', visitId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attachments')
                .select('*')
                .eq('visit_id', visitId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as Attachment[]
        },
        enabled: !!visitId,
    })
}

export function useUploadAttachment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            visitId,
            file,
            uploadedBy
        }: {
            visitId: string;
            file: File;
            uploadedBy: string;
        }) => {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `attachments/${visitId}/${fileName}`

            // Upload file to storage
            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Create attachment record
            const { data, error } = await supabase
                .from('attachments')
                .insert([{
                    visit_id: visitId,
                    filename: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type,
                    uploaded_by: uploadedBy,
                }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['attachments', variables.visitId] })
        },
    })
}

export function useDeleteAttachment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (attachment: Attachment) => {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('attachments')
                .remove([attachment.file_path])

            if (storageError) throw storageError

            // Delete from database
            const { error } = await supabase
                .from('attachments')
                .delete()
                .eq('id', attachment.id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments'] })
        },
    })
}

export function getAttachmentUrl(filePath: string) {
    const { data } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

    return data.publicUrl
}

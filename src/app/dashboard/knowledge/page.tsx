import { getFAQs } from "@/app/actions/faq";
import { KnowledgeClient } from "./knowledge-client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function KnowledgePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const faqs = await getFAQs();

    return (
        <div className="p-8 pb-20">
            <KnowledgeClient initialFaqs={faqs} />
        </div>
    );
}
